param(
  [string]$SourceDirectory = (Join-Path $env:USERPROFILE 'Downloads')
)

$ErrorActionPreference = 'Stop'
$maximumOutputBytes = 95000000
$repositoryRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$outputRoot = Join-Path $repositoryRoot 'public\documents\regulations'
$stagingRoot = Join-Path $outputRoot '.staging'
$pythonPath = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$optimizerPath = Join-Path $PSScriptRoot 'optimize-scanned-regulation.py'

$documents = @(
  [ordered]@{
    Id = 'nomenclature-804n'
    SourceName = 'Приказ Минздрава РФ от 13.10.2017 N 804Н Об утверждении номенклатуры медицинских услуг.rtf'
    SourceSha256 = 'EF7C95DA20A8F2D0736205CCAFF44C3028A6A5F9280211229F3073E6B8C76DC0'
    OutputName = 'nomenclature-804n.pdf'
    Mode = 'rtf'
    ExpectedPages = $null
  },
  [ordered]@{
    Id = 'medicines-890'
    SourceName = 'Постановление Правительства РФ от 30.07.94 N 890 О государственной поддержке развития медицинской.rtf'
    SourceSha256 = '24F3789D214B9397D9A66C152540B6D13AFAE4EC76DB0E29FB3D0A2CD4B5DCFB'
    OutputName = 'medicines-890.pdf'
    Mode = 'rtf'
    ExpectedPages = $null
  },
  [ordered]@{
    Id = 'state-guarantees-1940'
    SourceName = '0001202412290002.pdf'
    SourceSha256 = '00E1C58C48EF8E7602D391B9AE9AD2A81F2FCB7B454A9D519BB9AA87155140D6'
    OutputName = 'state-guarantees-1940.pdf'
    Mode = 'optimized-pdf'
    ExpectedPages = 698
  },
  [ordered]@{
    Id = 'state-guarantees-2188'
    SourceName = '0001202512300036.pdf'
    SourceSha256 = '2CAAFA72E4481F373222949F7F533668A5CAC5C78A1DC72F925F414CB42FC45C'
    OutputName = 'state-guarantees-2188.pdf'
    Mode = 'optimized-pdf'
    ExpectedPages = 872
  },
  [ordered]@{
    Id = 'health-law-323'
    SourceName = 'Федеральный закон от 21.11.2011 N 323-ФЗ Об основах охраны здоровья граждан в Российской Федерации.rtf'
    SourceSha256 = '43B167C46061DC694905250E983629EB9EADACE73C57B0AB749ED94BA3450ABA'
    OutputName = 'health-law-323.pdf'
    Mode = 'rtf'
    ExpectedPages = $null
  },
  [ordered]@{
    Id = 'order-118n'
    SourceName = 'Приказ Минздрава РФ от 13.03.2025 N 118Н Об информации, необходимой для проведения независимой.rtf'
    SourceSha256 = '846A50A67AEB674986E5046EFB66B56413EAE6D6E69ACCC58CC272C4CA264758'
    OutputName = 'order-118n.pdf'
    Mode = 'rtf'
    ExpectedPages = $null
  },
  [ordered]@{
    Id = 'paid-services-659'
    SourceName = '0001202606010083.pdf'
    SourceSha256 = '7AF320A12723F96F934DFCD231E3971D80560ADEEB385DB058255FB1712497C2'
    OutputName = 'paid-services-659.pdf'
    Mode = 'exact-pdf'
    ExpectedPages = 18
  },
  [ordered]@{
    Id = 'paid-services-736'
    SourceName = 'Постановление Правительства РФ от 11.05.2023 N 736 Об утверждении Правил предоставления медицинскими.rtf'
    SourceSha256 = 'D4A3F220449370FC3969C9855A9822EB247B8F7C4E9171951C6C6A1390FB4816'
    OutputName = 'paid-services-736.pdf'
    Mode = 'rtf'
    ExpectedPages = $null
  }
)

function Get-PdfPageCount {
  param([string]$Path)
  $count = & $pythonPath -c 'from pypdf import PdfReader; import sys; print(len(PdfReader(sys.argv[1]).pages))' $Path
  if ($LASTEXITCODE -ne 0) { throw "Could not read PDF page count: $Path" }
  return [int]$count
}

function Assert-Pdf {
  param(
    [string]$Path,
    [Nullable[int]]$ExpectedPages
  )
  $item = Get-Item -LiteralPath $Path
  if ($item.Length -ge $maximumOutputBytes) {
    throw "PDF exceeds $maximumOutputBytes bytes: $Path ($($item.Length))"
  }
  $stream = [System.IO.File]::OpenRead($Path)
  try {
    $signature = New-Object byte[] 4
    if ($stream.Read($signature, 0, 4) -ne 4 -or [Text.Encoding]::ASCII.GetString($signature) -ne '%PDF') {
      throw "File does not have a PDF signature: $Path"
    }
  } finally {
    $stream.Dispose()
  }
  $pages = Get-PdfPageCount -Path $Path
  if ($pages -lt 1) { throw "PDF has no pages: $Path" }
  if ($null -ne $ExpectedPages -and $pages -ne $ExpectedPages) {
    throw "PDF page count mismatch: expected $ExpectedPages, got $pages ($Path)"
  }
  return $pages
}

$sourceRoot = (Resolve-Path -LiteralPath $SourceDirectory).Path
if (-not (Test-Path -LiteralPath $pythonPath -PathType Leaf)) { throw "Bundled Python was not found: $pythonPath" }
if (-not (Test-Path -LiteralPath $optimizerPath -PathType Leaf)) { throw "Optimizer was not found: $optimizerPath" }

foreach ($record in $documents) {
  $sourcePath = Join-Path $sourceRoot $record.SourceName
  if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) { throw "Source file is missing: $sourcePath" }
  $actualHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToUpperInvariant()
  if ($actualHash -ne $record.SourceSha256) {
    throw "Source SHA-256 mismatch for $($record.Id): $actualHash"
  }
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
if (Test-Path -LiteralPath $stagingRoot) {
  $resolvedOutput = (Resolve-Path -LiteralPath $outputRoot).Path
  $resolvedStaging = (Resolve-Path -LiteralPath $stagingRoot).Path
  if (-not $resolvedStaging.StartsWith($resolvedOutput + [IO.Path]::DirectorySeparatorChar)) {
    throw 'Staging path escaped the regulation output directory'
  }
  Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $stagingRoot | Out-Null

$word = $null
try {
  $rtfDocuments = @($documents | Where-Object { $_.Mode -eq 'rtf' })
  if ($rtfDocuments.Count -gt 0) {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $word.Options.UpdateLinksAtOpen = $false
    $confirmConversions = $false
    $readOnly = $true
    $addToRecentFiles = $false

    foreach ($record in $rtfDocuments) {
      $sourcePath = Join-Path $sourceRoot $record.SourceName
      $temporaryPath = Join-Path $stagingRoot $record.OutputName
      $document = $null
      try {
        $document = $word.Documents.Open($sourcePath, $confirmConversions, $readOnly, $addToRecentFiles)
        $document.ExportAsFixedFormat($temporaryPath, 17)
      } finally {
        if ($null -ne $document) {
          $document.Close($false)
          [void][Runtime.InteropServices.Marshal]::ReleaseComObject($document)
        }
      }
      [void](Assert-Pdf -Path $temporaryPath -ExpectedPages $null)
      Write-Output "CONVERTED $($record.Id)"
    }
  }
} finally {
  if ($null -ne $word) {
    $word.Quit()
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

foreach ($record in @($documents | Where-Object { $_.Mode -ne 'rtf' })) {
  $sourcePath = Join-Path $sourceRoot $record.SourceName
  $temporaryPath = Join-Path $stagingRoot $record.OutputName
  if ($record.Mode -eq 'exact-pdf') {
    Copy-Item -LiteralPath $sourcePath -Destination $temporaryPath
  } elseif ($record.Mode -eq 'optimized-pdf') {
    & $pythonPath $optimizerPath $sourcePath $temporaryPath $record.ExpectedPages
    if ($LASTEXITCODE -ne 0) { throw "PDF optimization failed for $($record.Id)" }
  } else {
    throw "Unsupported preparation mode: $($record.Mode)"
  }
  [void](Assert-Pdf -Path $temporaryPath -ExpectedPages $record.ExpectedPages)
  Write-Output "PREPARED $($record.Id)"
}

foreach ($record in $documents) {
  $temporaryPath = Join-Path $stagingRoot $record.OutputName
  $finalPath = Join-Path $outputRoot $record.OutputName
  Move-Item -LiteralPath $temporaryPath -Destination $finalPath -Force
}

$integrityItems = foreach ($record in $documents) {
  $finalPath = Join-Path $outputRoot $record.OutputName
  $pages = Assert-Pdf -Path $finalPath -ExpectedPages $record.ExpectedPages
  $item = Get-Item -LiteralPath $finalPath
  [ordered]@{
    id = $record.Id
    href = "documents/regulations/$($record.OutputName)"
    size = $item.Length
    sha256 = (Get-FileHash -LiteralPath $finalPath -Algorithm SHA256).Hash.ToUpperInvariant()
    pages = $pages
  }
}

$manifest = [ordered]@{ version = 1; items = @($integrityItems) } | ConvertTo-Json -Depth 5
$manifestTemporary = Join-Path $outputRoot 'integrity.json.tmp'
$manifestFinal = Join-Path $outputRoot 'integrity.json'
[IO.File]::WriteAllText($manifestTemporary, $manifest + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
Move-Item -LiteralPath $manifestTemporary -Destination $manifestFinal -Force
Remove-Item -LiteralPath $stagingRoot

Write-Output "Prepared $($documents.Count) regulatory PDF files."
