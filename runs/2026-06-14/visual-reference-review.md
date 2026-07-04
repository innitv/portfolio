# Visual Reference Review

## Inputs Used

- Figma Make: `https://www.figma.com/make/obk2PddZqIIoZIYAbj5iFb/Сайт-портфолио-продуктового-дизайнера`
- Current portfolio site: `https://ivan-ignatov.online/`
- Local frontend: `http://127.0.0.1:5177/portfolio`

## Source Pair Matrix

| Pair | Required | Evidence | Status | Notes |
|---|---|---|---|---|
| `reference_to_figma` | no | Make file is the visual reference, not an editable design frame | not_applicable | Earlier Figma frames exist but this pass moved to frontend |
| `figma_to_frontend` | yes | Figma Make source files read through MCP, then reimplemented in React/CSS | passed_with_notes | Local implementation uses same visual grammar, not a literal copy |
| `reference_to_frontend` | yes | Browser screenshot and DOM checks | passed_with_notes | Manual screenshot check only, no automated visual diff |
| `spec_to_frontend_behavior` | yes | User-specified IA flow and route checks | passed | Home/company/case verified |

## Visual Decisions

| Decision | Source | Output |
|---|---|---|
| Use row-based company index instead of cards | User feedback + Make reference | `/portfolio` |
| Keep cases out of home page | User IA correction | `/portfolio` |
| Use case index per company | Make `company-page.tsx` + user flow | `/portfolio/a3`, `/portfolio/rtk`, `/portfolio/smlt` |
| Use article layout for detail page | Make `case-page.tsx` | `/portfolio/:companyId/case/:caseId` |
| Use scoped CSS namespace | Existing app constraints | `.portfolio-*` CSS |

## Verification

| Check | Result |
|---|---|
| Desktop render | Passed manual browser screenshot smoke |
| Company flow | Passed DOM check for `/portfolio/a3` |
| Case article | Passed DOM check for `/portfolio/a3/case/dashboard-redesign` |
| Mobile overflow | Failed initially, fixed with scoped `box-sizing` and mobile width constraints |

## Known Gaps

- No saved screenshot artifacts in this run directory yet.
- No automated visual diff against Figma Make.
- CSS previews are schematic; production should use actual case media.

## Verdict

`passed_with_notes`: visual direction follows the selected Make reference and corrects the IA, but production transfer still needs real screenshots/media and full case detail content.
