Non-superadmin education administrators see only Leerlingen & contacten and Leerling-aanmeldingen; keep navigation and route gating aligned so hidden pages cannot be opened via direct links.
Education directory and registration changes are captured by database triggers, not browser calls, so edits through every client path leave a trustworthy trail; only mosque superadmins may read the audit trail.
Sort education classes through the shared Arabic-label comparator so preparatory أ and ب precede grades 1–6 even when labels have different prefixes.
Convert-committee access is per tenant via convert_committee_members + is_convert_committee(); files live under <tenant_id>/ in the private convert-certificates bucket so storage RLS can scope by folder.
Expose the convert-committee workspace as its own superadmin route instead of nesting it inside the sermon uploader, so education access does not hide it.
