# Trigger the "Scrape events" GitHub Actions workflow via API.
# Requires: GITHUB_TOKEN env var (PAT with repo + workflow scope).
# Usage: .\tools\trigger_scrape_workflow.ps1
$owner = "eltonaguiar"
$repo = "findtorontoevents_antigravity.ca"
$workflow = "scrape-events.yml"
$token = $env:GITHUB_TOKEN
if (-not $token) {
    Write-Host "GITHUB_TOKEN not set. Set it with: `$env:GITHUB_TOKEN = 'your_pat'"
    Write-Host "Or trigger manually: https://github.com/$owner/$repo/actions/workflows/$workflow"
    exit 1
}
$url = "https://api.github.com/repos/$owner/$repo/actions/workflows/$workflow/dispatches"
$body = '{"ref":"main"}'
$headers = @{
    "Authorization" = "Bearer $token"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
    "Content-Type" = "application/json"
}
try {
    $r = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    Write-Host "Workflow triggered. See: https://github.com/$owner/$repo/actions"
} catch {
    Write-Host "Error: $_"
    if ($_.Exception.Response) { Write-Host "Status: $($_.Exception.Response.StatusCode)" }
    exit 1
}
