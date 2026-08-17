import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const powershellPath = 'scripts/prepare-regulatory-documents.ps1';
const optimizerPath = 'scripts/optimize-scanned-regulation.py';
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

const requiredHashes = [
  'EF7C95DA20A8F2D0736205CCAFF44C3028A6A5F9280211229F3073E6B8C76DC0',
  '24F3789D214B9397D9A66C152540B6D13AFAE4EC76DB0E29FB3D0A2CD4B5DCFB',
  '00E1C58C48EF8E7602D391B9AE9AD2A81F2FCB7B454A9D519BB9AA87155140D6',
  '2CAAFA72E4481F373222949F7F533668A5CAC5C78A1DC72F925F414CB42FC45C',
  '43B167C46061DC694905250E983629EB9EADACE73C57B0AB749ED94BA3450ABA',
  '846A50A67AEB674986E5046EFB66B56413EAE6D6E69ACCC58CC272C4CA264758',
  '7AF320A12723F96F934DFCD231E3971D80560ADEEB385DB058255FB1712497C2',
  'D4A3F220449370FC3969C9855A9822EB247B8F7C4E9171951C6C6A1390FB4816',
];

describe('regulatory document preparation tools', () => {
  it('pins inputs and converts RTF through hidden read-only Word automation', () => {
    expect(existsSync(powershellPath)).toBe(true);
    const script = readFileSync(powershellPath, 'utf8');

    for (const hash of requiredHashes) expect(script).toContain(hash);
    expect(script).toMatch(/Visible\s*=\s*\$false/i);
    expect(script).toMatch(/DisplayAlerts\s*=\s*0/i);
    expect(script).toMatch(/\$readOnly\s*=\s*\$true/i);
    expect(script).toMatch(/\$addToRecentFiles\s*=\s*\$false/i);
    expect(script).toMatch(/Documents\.Open\([^\r\n]*\$readOnly[^\r\n]*\$addToRecentFiles/i);
    expect(script).toMatch(/ExportAsFixedFormat\([^\r\n]*,\s*17\s*\)/i);
    expect(script).toContain("'.staging'");
    expect(script).toMatch(/Move-Item/i);
    expect(script).toContain('95000000');
  });

  it('preserves scanned-PDF page counts and fails closed', () => {
    expect(existsSync(optimizerPath)).toBe(true);
    const script = readFileSync(optimizerPath, 'utf8');

    expect(script).toContain('PdfReader');
    expect(script).toContain('PdfWriter');
    expect(script).toMatch(/len\(source\.pages\)\s*!=\s*expected_pages/);
    expect(script).toMatch(/len\(result\.pages\)\s*!=\s*expected_pages/);
    expect(script).toMatch(/len\(images\)\s*!=\s*1/);
    expect(script).toContain('threshold = 190');
    expect(script).toContain('95_000_000');
    expect(script).toMatch(/replace\(temporary, output\)/);
  });

  it('exposes one reproducible package command', () => {
    expect(packageJson.scripts['prepare:regulations'])
      .toBe('pwsh -NoProfile -File scripts/prepare-regulatory-documents.ps1');
  });
});
