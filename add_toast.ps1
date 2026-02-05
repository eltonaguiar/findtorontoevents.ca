$file = 'E:\findtorontoevents_antigravity.ca\favcreators\src\App.tsx'
$content = Get-Content $file -Raw

# Add toast state after line 761 (after showLiveSummary state)
$pattern = '(\s+// Persist live summary visibility)'
$replacement = "`r`n  // Toast notification state`r`n  const [toastMessage, setToastMessage] = useState<string | null>(null);`r`n`r`n  // Auto-hide toast after 3 seconds`r`n  useEffect(() => {`r`n    if (toastMessage) {`r`n      const timer = setTimeout(() => setToastMessage(null), 3000);`r`n      return () => clearTimeout(timer);`r`n    }`r`n  }, [toastMessage]);`r`n`r`n`$1"
$content = $content -replace $pattern, $replacement

# Update handleCheckCreatorStatus to show toast
$pattern = '(const handleCheckCreatorStatus = async \(id: string\) => \{[\r\n\s]+const creator = creators\.find\(\(c\) => c\.id === id\);[\r\n\s]+if \(!creator\) return;)'
$replacement = "`$1`r`n`r`n  // Show toast notification`r`n  setToastMessage(``⚡ Checking live status for `${creator.name}...``);"
$content = $content -replace $pattern, $replacement

Set-Content $file -Value $content -NoNewline
Write-Host "Added toast state and updated handler"
