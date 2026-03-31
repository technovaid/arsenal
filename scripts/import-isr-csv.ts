/**
 * Import ISR Settlement data from CSV into PostgreSQL (isr_links table)
 *
 * Usage:
 *   npx ts-node scripts/import-isr-csv.ts [path-to-csv]
 *
 * Default CSV path: ../../ARSENAL_UC2_UC1_ALL_IN_ONE_SHEET - ALL_DATA.csv
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseFloat2(v: string | undefined): number | null {
  if (!v || v.trim() === '' || v.trim() === 'N/A') return null;
  const cleaned = v.replace(/'/g, '').trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseInt2(v: string | undefined): number | null {
  if (!v || v.trim() === '') return null;
  const n = parseInt(v.trim(), 10);
  return isNaN(n) ? null : n;
}

function parseBigInt2(v: string | undefined): bigint | null {
  if (!v || v.trim() === '') return null;
  try {
    return BigInt(v.trim());
  } catch {
    return null;
  }
}

function parseDate2(v: string | undefined): Date | null {
  if (!v || v.trim() === '' || v.trim() === 'N/A') return null;
  const d = new Date(v.trim());
  return isNaN(d.getTime()) ? null : d;
}

function parseBool2(v: string | undefined): boolean | null {
  if (!v || v.trim() === '') return null;
  const s = v.trim().toUpperCase();
  if (s === 'TRUE') return true;
  if (s === 'FALSE') return false;
  return null;
}

function str(v: string | undefined): string | null {
  if (!v || v.trim() === '') return null;
  return v.trim();
}

// ─── CSV Parser (handles quoted fields with commas) ─────────────────────────

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Row → Prisma data mapper ───────────────────────────────────────────────

function mapRowToIsrLink(h: Record<string, string>) {
  return {
    // Core ISR
    isr:            parseBigInt2(h['ISR']) ?? BigInt(0),
    applicationId:  parseBigInt2(h['Application ID']),
    licenseNumber:  parseBigInt2(h['License Number']),
    isrStatus:      str(h['status']),
    regionCode:     str(h['region']),
    regionName:     str(h['region name']),
    isrDate:        parseDate2(h['isr date']),
    expDate:        parseDate2(h['exp date']),
    freqTx:         parseFloat2(h['freq tx']),
    freqRx:         parseFloat2(h['freq rx']),

    // Near End
    nearIdAntena:    str(h['near id antena']),
    nearSite:        str(h['near site']),
    nearSiteName:    str(h['near site name']),
    nearLatDecimal:  parseFloat2(h['near_lat_decimal']),
    nearLongDecimal: parseFloat2(h['near_long_decimal']),
    nearProvinsi:    str(h['near provinsi']),
    nearCity:        str(h['near city']),
    nearKecamatan:   str(h['near kecamatan']),
    nearAddress:     str(h['near address']),
    nearAgl:         parseFloat2(h['near_agl']),
    nearPower:       parseFloat2(h['near_power']),

    // Far End
    farIdAntena:     str(h['far id antena']),
    farSite:         str(h['far site']),
    farSiteName:     str(h['far site name']),
    farLatDecimal:   parseFloat2(h['far_lat_decimal']),
    farLongDecimal:  parseFloat2(h['far_long_decimal']),
    farProvinsi:     str(h['far provinsi']),
    farCity:         str(h['far city']),
    farKecamatan:    str(h['far kecamatan']),
    farAddress:      str(h['far address']),
    farAgl:          parseFloat2(h['far_agl']),
    farPower:        parseFloat2(h['far_power']),

    // Radio
    radioType:       str(h['radio_type']),
    polarization:    str(h['polarization']),
    bandwidth:       parseFloat2(h['bandwidth']),
    vendorName:      str(h['vendor name']),
    nearIdPerangkat: str(h['near id perangkat']),
    farIdPerangkat:  str(h['far id perangkat']),
    onAirDate:       parseDate2(h['on_air_date']),

    // MDRS Near End
    mdrsNeSitenameTelkomsel: str(h['MDRS_NE_Sitename Telkomsel']),
    mdrsNeRegion:            str(h['MDRS_NE_Region']),
    mdrsNeLongitudeRegion:   parseFloat2(h['MDRS_NE_Longitude Region']),
    mdrsNeLatitudeRegion:    parseFloat2(h['MDRS_NE_Latitude Region']),
    mdrsNeMdrsCode:          str(h['MDRS_NE_MDRS Code']),
    mdrsNePlusCode:          str(h['MDRS_NE_Plus Code']),
    mdrsNeSitenameKominfo:   str(h['MDRS_NE_Sitename Kominfo']),
    mdrsNeLongitude:         parseFloat2(h['MDRS_NE_Longitude']),
    mdrsNeLatitude:          parseFloat2(h['MDRS_NE_Latitude']),
    mdrsNeProvince:          str(h['MDRS_NE_Province']),
    mdrsNeDistrict:          str(h['MDRS_NE_District']),
    mdrsNeCity:              str(h['MDRS_NE_City']),
    mdrsNeVillage:           str(h['MDRS_NE_Village']),
    mdrsNeZone:              str(h['MDRS_NE_Zone']),
    mdrsNeSpectrumGrid:      str(h['MDRS_NE_Spectrum License Grid']),
    mdrsNeCreationDate:      str(h['MDRS_NE_Creation Date']),
    mdrsNeStatus:            str(h['MDRS_NE_Status']),

    // MDRS Far End
    mdrsFeSitenameTelkomsel: str(h['MDRS_FE_Sitename Telkomsel']),
    mdrsFeRegion:            str(h['MDRS_FE_Region']),
    mdrsFeLongitudeRegion:   parseFloat2(h['MDRS_FE_Longitude Region']),
    mdrsFeLatitudeRegion:    parseFloat2(h['MDRS_FE_Latitude Region']),
    mdrsFeMdrsCode:          str(h['MDRS_FE_MDRS Code']),
    mdrsFePlusCode:          str(h['MDRS_FE_Plus Code']),
    mdrsFeSitenameKominfo:   str(h['MDRS_FE_Sitename Kominfo']),
    mdrsFeLongitude:         parseFloat2(h['MDRS_FE_Longitude']),
    mdrsFeLatitude:          parseFloat2(h['MDRS_FE_Latitude']),
    mdrsFeProvince:          str(h['MDRS_FE_Province']),
    mdrsFeDistrict:          str(h['MDRS_FE_District']),
    mdrsFeCity:              str(h['MDRS_FE_City']),
    mdrsFeVillage:           str(h['MDRS_FE_Village']),
    mdrsFeZone:              str(h['MDRS_FE_Zone']),
    mdrsFeSpectrumGrid:      str(h['MDRS_FE_Spectrum License Grid']),
    mdrsFeCreationDate:      str(h['MDRS_FE_Creation Date']),
    mdrsFeStatus:            str(h['MDRS_FE_Status']),

    // Invoice
    invId:               str(h['INV_ID. INVOICE']),
    invNoInvoice:        str(h['INV_NO. INVOICE']),
    invNoRr:             str(h['INV_NO. RR']),
    invNilaiInvoice:     parseFloat2(h['INV_NILAI INVOICE']),
    invNilaiBayar:       parseFloat2(h['INV_NILAI_BAYAR']),
    invStatusInvoice:    str(h['INV_STATUS INVOICE']),
    invPeriodeAwal:      parseDate2(h['INV_PERIODE AWAL INVOICE']),
    invPeriodeAkhir:     parseDate2(h['INV_PERIODE AKHIR INVOICE']),
    invTanggalTerbit:    parseDate2(h['INV_TANGGAL TERBIT']),
    invJatuhTempo:       parseDate2(h['INV_JATUH TEMPO']),
    invTanggalBayar:     parseDate2(h['INV_TANGGAL BAYAR']),
    invNearEndSiteId:    str(h['INV_NEAR END SITE ID']),
    invFarEndSiteId:     str(h['INV_FAR END SITE ID']),
    invTipeInvoice:      str(h['INV_TIPE INVOICE']),
    invTerakhirDownload: str(h['INV_TERAKHIR DOWNLOAD']),

    // Potency (UC1)
    potNomor:      str(h['POT_Nomor']),
    potRegion:     str(h['POT_REGION']),
    potCount:      parseInt2(h['POT_Count']),
    potSiteNameNe: str(h['POT_SITE NAME NE']),
    potSiteNameFe: str(h['POT_SITE NAME FE']),
    potLongNe:     parseFloat2(h['POT_LONG NE']),
    potLatNe:      parseFloat2(h['POT_LAT NE']),
    potLongFe:     parseFloat2(h['POT_LONG FE']),
    potLatFe:      parseFloat2(h['POT_LAT FE']),
    potFrekNe:     str(h['POT_FREK NE']),
    potFrekFe:     str(h['POT_FREK FE']),
    potBw:         parseFloat2(h['POT_BW']),

    // UC2 – MDRS Coordinate Compliance
    jarakDeviasiNeMeter: parseFloat2(h['Jarak_Deviasi_Meter']),
    jarakDeviasiFeMeter: parseFloat2(h['Jarak_Deviasi_Meter_FE']),
    statusUc2Ne:         str(h['Status_UC2_Modif']),
    statusUc2Fe:         str(h['Status_UC2_Modif_FE']),

    // UC1 – Potency Match
    distIsrPotensiNeMeter: parseFloat2(h['Dist_ISR_Potensi_NE_Meter']),
    distIsrPotensiFeMeter: parseFloat2(h['Dist_ISR_Potensi_FE_Meter']),
    statusUc1PotensiNe:    str(h['Status_UC1_Potensi_NE']),
    statusUc1PotensiFe:    str(h['Status_UC1_Potensi_FE']),
    statusRadiusNe:        str(h['Status_Radius_NE']),
    statusRadiusFe:        str(h['Status_Radius_FE']),
    tipeAnomalyNe:         str(h['Tipe_Anomaly_NE']),
    tipeAnomalyFe:         str(h['Tipe_Anomaly_FE']),
    statusKombinasiNeFe:   str(h['Status_Kombinasi_NE_FE']),
    rootCauseCategory:     str(h['Root_Cause_Category']),
    incompleteCategory:    str(h['Incomplete_Category']),

    // Radio Frequency Compliance
    matchTxNe:            parseBool2(h['Match_TX_NE']),
    matchRxFe:            parseBool2(h['Match_RX_FE']),
    matchBw:              parseBool2(h['Match_BW']),
    spectrumStatus:       str(h['Spectrum_Status']),
    distAbsNe:            parseFloat2(h['Dist_Abs_NE']),
    distAbsFe:            parseFloat2(h['Dist_Abs_FE']),
    signCheckNe:          str(h['Sign_Check_NE']),
    signCheckFe:          str(h['Sign_Check_FE']),
    finalValidationStatus: str(h['Final_Validation_Status']),

    // BW Distance Compliance
    freqGhz:       parseFloat2(h['freq_ghz']),
    bandCategory:  str(h['band_category']),
    minDistanceKm: parseFloat2(h['min_distance_km']),
    maxDistanceKm: parseFloat2(h['max_distance_km']),
    linkDistanceKm: parseFloat2(h['Link_Distance_KM']),
    ruleCompliance: str(h['Rule_Compliance']),
    distanceGapKm:  parseFloat2(h['Distance_Gap_KM']),
  };
}

// ─── Whole-file CSV splitter (handles multi-line quoted fields) ──────────────

function splitCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  const fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < content.length) {
    const ch = content[i];

    if (ch === '"') {
      if (inQuotes && content[i + 1] === '"') {
        field += '"';
        i += 2;
        continue;
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (ch === ',' && !inQuotes) {
      fields.push(field);
      field = '';
      i++;
      continue;
    }

    if ((ch === '\r' || ch === '\n') && !inQuotes) {
      // Handle \r\n
      if (ch === '\r' && content[i + 1] === '\n') i++;
      fields.push(field);
      field = '';
      if (fields.some(f => f !== '') || fields.length > 1) {
        rows.push([...fields]);
      }
      fields.length = 0;
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // Last field / row
  if (field || fields.length > 0) {
    fields.push(field);
    if (fields.some(f => f !== '')) rows.push([...fields]);
  }

  return rows;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = process.argv[2]
    ?? path.resolve(__dirname, '../../ARSENAL_UC2_UC1_ALL_IN_ONE_SHEET - ALL_DATA.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌  File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`📂  Reading: ${csvPath}`);

  const BATCH_SIZE = 500;
  let totalInserted = 0;
  let totalErrors = 0;

  // Read entire file (avoids problems with multi-line quoted fields)
  const content = fs.readFileSync(csvPath, { encoding: 'utf8' });
  const allRows = splitCsvRows(content);

  if (allRows.length < 2) {
    console.error('❌  CSV has no data rows');
    process.exit(1);
  }

  const headers = allRows[0];
  console.log(`📋  Detected ${headers.length} columns, ${allRows.length - 1} data rows`);

  // Clear existing data
  console.log('🗑️   Clearing existing isr_links data...');
  await prisma.isrLink.deleteMany({});
  console.log('✅  Cleared.');

  let batch: ReturnType<typeof mapRowToIsrLink>[] = [];

  for (let rowIdx = 1; rowIdx < allRows.length; rowIdx++) {
    const values = allRows[rowIdx];
    if (values.length < 5) continue; // skip malformed rows

    const rowObj: Record<string, string> = {};
    headers.forEach((h, i) => {
      rowObj[h] = values[i] ?? '';
    });

    try {
      batch.push(mapRowToIsrLink(rowObj));
    } catch (e) {
      totalErrors++;
      console.warn(`⚠️   Row ${rowIdx + 1} parse error: ${e}`);
    }

    if (batch.length >= BATCH_SIZE) {
      await prisma.isrLink.createMany({ data: batch as any, skipDuplicates: false });
      totalInserted += batch.length;
      process.stdout.write(`\r⏳  Inserted ${totalInserted} rows...`);
      batch = [];
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await prisma.isrLink.createMany({ data: batch as any, skipDuplicates: false });
    totalInserted += batch.length;
  }

  console.log(`\n✅  Done. Inserted: ${totalInserted}, Errors: ${totalErrors}`);
}

main()
  .catch((e) => {
    console.error('❌  Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
