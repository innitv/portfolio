<?php
/**
 * Приём заполненного брифа.
 *
 * 🔴 ДВА ПРИЁМНИКА, А НЕ ОДИН. Ответ сначала пишется в файл на этом же
 * хостинге и только потом уходит письмом. Причина простая: письма с shared-
 * хостинга регулярно попадают в «Спам» — общий IP, отсутствие DKIM, отправка
 * от имени домена без настроенного SPF. Если бы приёмник был один, потерянное
 * письмо означало бы потерянную заявку, о которой никто бы не узнал: человек
 * видит «отправлено», а на другом конце пусто. Файл переживает любой сбой
 * почты, и его всегда можно забрать по FTP.
 *
 * 🔴 ПАПКА С ОТВЕТАМИ ЗАКРЫТА ОТ ВЕБА. Всё в корне сайта публично по
 * умолчанию, а здесь лежат имя, телефон и почта заказчика. Доступ закрывает
 * `.htaccess`, который скрипт создаёт сам при первой записи: полагаться на то,
 * что кто-то не забудет положить его руками, нельзя.
 *
 * Данные никуда, кроме этого хостинга и почтового ящика владельца, не уходят —
 * ни на Formspree, ни в Telegram, ни в чужую аналитику.
 */

declare(strict_types=1);

/* ── Куда приходит ──────────────────────────────────────────────────────── */

const RECIPIENT = 'ignatovivin@gmail.com';
const SITE = 'ivan-ignatov.online';

/*
 * Где лежат ответы. Кандидата ДВА, и порядок важен.
 *
 * 🔴 Первый — на уровень ВЫШЕ корня сайта: оттуда файл недостижим по http
 * вообще, какой бы ни была конфигурация сервера. Но запись туда разрешена не на
 * каждом хостинге, а узнать это заранее нельзя — проверить можно только
 * попыткой. Если бы кандидат был один, отказ в правах означал бы 500 на
 * отправке: человек видит ошибку, бриф не записан, письмо не ушло.
 *
 * Второй — внутри корня, и он закрывается от веба `.htaccess`, который скрипт
 * кладёт сам (см. ниже), плюс правилом `RedirectMatch 404 ^/brief-data` в
 * `public/.htaccess`. Два рубежа против одного — поэтому порядок именно такой,
 * а не наоборот.
 */
const STORE_CANDIDATES = [__DIR__ . '/../brief-data', __DIR__ . '/brief-data'];

/* Минимальное время заполнения: бот отправляет форму мгновенно. */
const MIN_SECONDS = 12;

/* Сколько заявок с одного адреса в час — защита от залипшей кнопки и ботов. */
const RATE_LIMIT = 5;

header('Content-Type: application/json; charset=utf-8');

/*
 * 🔴 Без типа возврата `never`: он появился в PHP 8.1, а версия на шаред-хостинге
 * — не наш выбор и может смениться при переезде. Фатальная ошибка разбора здесь
 * означала бы 500 на каждой отправке, то есть потерянную заявку.
 */
function fail(int $code, string $message)
{
    http_response_code($code);
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail(405, 'Только POST');
}

$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 200000) {
    fail(413, 'Слишком длинный ответ');
}

$payload = json_decode($raw, true);
if (!is_array($payload)) {
    fail(400, 'Не разобрал тело запроса');
}

/*
 * Honeypot: поле, скрытое от человека и видимое роботу. Заполнено — значит
 * перед нами не человек. Отвечаем успехом, чтобы бот не подбирал обход.
 */
if (!empty($payload['website'])) {
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

$elapsed = (int) ($payload['elapsed'] ?? 0);
if ($elapsed > 0 && $elapsed < MIN_SECONDS) {
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

$answers = $payload['answers'] ?? null;
if (!is_array($answers) || $answers === []) {
    fail(400, 'Пустой бриф');
}

/* ── Хранилище ──────────────────────────────────────────────────────────── */

/**
 * Папка для ответов: первый кандидат, в который удалось записать.
 *
 * Проверяется именно ЗАПИСЬ, а не существование: папка может быть, а прав на
 * неё — нет, и тогда `is_dir` скажет «всё хорошо», а заявка потеряется строкой
 * ниже.
 */
function pick_store()
{
    foreach (STORE_CANDIDATES as $path) {
        if (!is_dir($path)) {
            @mkdir($path, 0700, true);
        }
        if (is_dir($path) && is_writable($path)) {
            return $path;
        }
    }

    return null;
}

$store = pick_store();
if ($store === null) {
    fail(500, 'Не создалась папка для ответов');
}

$guard = $store . '/.htaccess';
if (!is_file($guard)) {
    file_put_contents(
        $guard,
        "# Ответы брифа: персональные данные заказчиков.\n"
        . "# Папка закрыта от веба — забирать файлы по FTP.\n"
        . "Require all denied\n"
        . "<IfModule !mod_authz_core.c>\n  Deny from all\n</IfModule>\n"
    );
}

/* Частота: простой счётчик по часу и адресу, без базы. */
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$stamp = $store . '/rate-' . date('Y-m-d-H') . '-' . md5($ip) . '.count';
$seen = is_file($stamp) ? (int) file_get_contents($stamp) : 0;
if ($seen >= RATE_LIMIT) {
    fail(429, 'Слишком много отправок подряд. Напишите письмом.');
}
file_put_contents($stamp, (string) ($seen + 1));

$now = new DateTimeImmutable('now', new DateTimeZone('Europe/Moscow'));
$record = [
    'at' => $now->format(DateTimeInterface::ATOM),
    'ip' => $ip,
    /* `substr`, а не `mb_substr`: mbstring на шаред-хостинге отключают, а
       строка агента и так состоит из латиницы. */
    'agent' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300),
    'answers' => $answers,
];

$file = $store . '/brief-' . $now->format('Y-m') . '.jsonl';
$line = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";

if (file_put_contents($file, $line, FILE_APPEND | LOCK_EX) === false) {
    fail(500, 'Не записался ответ');
}

/* ── Письмо ─────────────────────────────────────────────────────────────── */

$lines = [];
foreach ($answers as $question => $answer) {
    $value = is_array($answer) ? implode(', ', array_map('strval', $answer)) : (string) $answer;
    if (trim($value) === '') {
        continue;
    }
    $lines[] = (string) $question;
    $lines[] = $value;
    $lines[] = '';
}

$who = '';
foreach (['Имя', 'Компания', 'Почта'] as $key) {
    if (!empty($answers[$key])) {
        $who = ' · ' . (is_array($answers[$key]) ? implode(', ', $answers[$key]) : $answers[$key]);
        break;
    }
}

/*
 * 🔴 Кириллица в заголовках письма кодируется, а не пишется как есть: поля
 * заголовка по RFC 2047 семибитные, и необработанный UTF-8 в теме или в имени
 * отправителя часть серверов превращает в «кракозябры», а часть считает
 * признаком спама. Кодируются ОБА места — и тема, и подпись отправителя.
 */
function mime_word(string $text): string
{
    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

$subject = 'Бриф' . $who;
$body = implode("\n", $lines)
    . "\n—\n"
    . 'Отправлено ' . $now->format('d.m.Y H:i') . " МСК\n"
    . 'Копия сохранена в ' . basename($file) . "\n";

$replyTo = '';
foreach ($answers as $key => $value) {
    if (is_string($value) && filter_var(trim($value), FILTER_VALIDATE_EMAIL)) {
        $replyTo = trim($value);
        break;
    }
}

$headers = [
    'From: ' . mime_word('Бриф') . ' <noreply@' . SITE . '>',
    'Content-Type: text/plain; charset=utf-8',
    'X-Mailer: brief-send.php',
];
if ($replyTo !== '') {
    $headers[] = 'Reply-To: ' . $replyTo;
}

/*
 * Результат mail() НЕ влияет на ответ формы: письмо — второй канал, а не
 * первый. Человек уже отправил бриф, и ответ у нас записан; сообщать ему об
 * отказе почтового сервера бессмысленно — он всё равно ничего с этим не
 * сделает. Факт отказа уходит в тот же файл, чтобы владелец знал.
 */
$sent = function_exists('mail')
    && @mail(RECIPIENT, mime_word($subject), $body, implode("\r\n", $headers));

if (!$sent) {
    file_put_contents(
        $store . '/mail-failures.log',
        $now->format(DateTimeInterface::ATOM) . ' письмо не ушло, запись в ' . basename($file) . "\n",
        FILE_APPEND | LOCK_EX
    );
}

echo json_encode(['ok' => true, 'mailed' => $sent], JSON_UNESCAPED_UNICODE);
