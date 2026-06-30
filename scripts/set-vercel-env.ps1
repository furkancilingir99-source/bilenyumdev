param(
  [Parameter(Mandatory = $true)][string]$SupabaseUrl,
  [Parameter(Mandatory = $true)][string]$AnonKey
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot + "\.."

Write-Host "Vercel ortam degiskenleri ekleniyor..." -ForegroundColor Cyan
Write-Host "Once Vercel girisi gerekebilir (tarayici acilir)." -ForegroundColor Yellow

$SupabaseUrl | npx vercel env add SUPABASE_URL production
$AnonKey | npx vercel env add SUPABASE_ANON_KEY production

Write-Host ""
Write-Host "Tamam. Simdi redeploy:" -ForegroundColor Green
Write-Host "  npx vercel --prod" -ForegroundColor White
Write-Host "veya Vercel Dashboard -> Deployments -> Redeploy" -ForegroundColor White
