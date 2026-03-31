import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Status Derivation Helpers ──────────────────────────────────────────────

function deriveIsrVsMdrs(row: {
  statusUc2Ne: string | null;
  statusUc2Fe: string | null;
  statusKombinasiNeFe: string | null;
}): string {
  const combo = row.statusKombinasiNeFe ?? '';
  if (combo.includes('PERFECT MATCH')) return 'NE & FE Comply';
  const ne = row.statusUc2Ne ?? '';
  const fe = row.statusUc2Fe ?? '';
  const neMissing = ne.includes('MISSING') || ne === '';
  const feMissing = fe.includes('MISSING') || fe === '';
  if (neMissing && feMissing) return 'Missing Data';
  if (neMissing || feMissing) return 'Partial';
  const neOk = ne.includes('COMPLIANT');
  const feOk = fe.includes('COMPLIANT');
  if (neOk && feOk) return 'NE & FE Comply';
  if (neOk || feOk) return 'Partial';
  return 'Not Comply';
}

function deriveIsrVsPotency(row: {
  statusUc1PotensiNe: string | null;
  statusUc1PotensiFe: string | null;
}): string {
  const ne = row.statusUc1PotensiNe ?? '';
  const fe = row.statusUc1PotensiFe ?? '';
  const neNoData = ne.includes('NO POTENSI');
  const feNoData = fe.includes('NO POTENSI');
  if (neNoData && feNoData) return 'No Data';
  const neMatch = ne.includes('MATCH') && !ne.includes('UNMATCH');
  const feMatch = fe.includes('MATCH') && !fe.includes('UNMATCH');
  if (neMatch && feMatch) return 'NE & FE Match';
  if (neMatch || feMatch) return 'Partial';
  return 'Mismatch';
}

function deriveRadioFrequency(row: {
  matchTxNe: boolean | null;
  matchRxFe: boolean | null;
  matchBw: boolean | null;
}): string {
  const tx = row.matchTxNe;
  const rx = row.matchRxFe;
  const bw = row.matchBw;
  if (tx === true && rx === true && bw === true) return 'Freq. & BW Match';
  if (tx === false && rx === false && bw === false) return 'Freq. & BW Mismatch';
  if ((tx === false || rx === false) && bw === true) return 'Frequency Mismatch';
  if (bw === false && tx !== false && rx !== false) return 'BW Mismatch';
  if (tx === null && rx === null && bw === null) return 'No Data';
  return 'Freq. & BW Mismatch';
}

function deriveBwDistance(ruleCompliance: string | null): string {
  if (!ruleCompliance) return 'No Data';
  return ruleCompliance.includes('COMPLIANT') ? 'Comply' : 'Not Comply';
}

function deriveOverallStatus(row: {
  statusUc2Ne: string | null;
  statusUc2Fe: string | null;
  statusKombinasiNeFe: string | null;
  statusUc1PotensiNe: string | null;
  statusUc1PotensiFe: string | null;
  matchTxNe: boolean | null;
  matchRxFe: boolean | null;
  matchBw: boolean | null;
  ruleCompliance: string | null;
}): string {
  const mdrs = deriveIsrVsMdrs(row);
  const potency = deriveIsrVsPotency(row);
  const radio = deriveRadioFrequency(row);
  const bw = deriveBwDistance(row.ruleCompliance);

  const allComply =
    (mdrs === 'NE & FE Comply') &&
    (potency === 'NE & FE Match' || potency === 'No Data') &&
    (radio === 'Freq. & BW Match' || radio === 'No Data') &&
    (bw === 'Comply' || bw === 'No Data');

  if (allComply) return 'NE & FE Comply';

  const statuses = [mdrs, potency, radio, bw];
  if (statuses.some(s => s.includes('Not Comply') || s.includes('Mismatch'))) {
    return 'Not Comply';
  }
  return 'Partial';
}

// ─── Filter Builder ──────────────────────────────────────────────────────────

function buildWhere(params: {
  search?: string;
  region?: string;
  nearProvinsi?: string;
  nearCity?: string;
  isrStatus?: string;
  statusKombinasiNeFe?: string;
  ruleCompliance?: string;
  bandCategory?: string;
}): Prisma.IsrLinkWhereInput {
  const where: Prisma.IsrLinkWhereInput = {};

  if (params.isrStatus && params.isrStatus !== 'all') {
    where.isrStatus = params.isrStatus;
  }

  if (params.region && params.region !== 'All Region') {
    where.regionName = { contains: params.region, mode: 'insensitive' };
  }

  if (params.nearProvinsi && params.nearProvinsi !== 'All Province') {
    where.nearProvinsi = { contains: params.nearProvinsi, mode: 'insensitive' };
  }

  if (params.nearCity && params.nearCity !== 'All City') {
    where.nearCity = { contains: params.nearCity, mode: 'insensitive' };
  }

  if (params.statusKombinasiNeFe && params.statusKombinasiNeFe !== 'all') {
    where.statusKombinasiNeFe = { contains: params.statusKombinasiNeFe, mode: 'insensitive' };
  }

  if (params.ruleCompliance && params.ruleCompliance !== 'all') {
    where.ruleCompliance = { contains: params.ruleCompliance, mode: 'insensitive' };
  }

  if (params.bandCategory && params.bandCategory !== 'All Band') {
    where.bandCategory = { contains: params.bandCategory, mode: 'insensitive' };
  }

  if (params.search) {
    where.OR = [
      { nearSite: { contains: params.search, mode: 'insensitive' } },
      { farSite: { contains: params.search, mode: 'insensitive' } },
      { nearSiteName: { contains: params.search, mode: 'insensitive' } },
      { farSiteName: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

// ─── Service Class ───────────────────────────────────────────────────────────

export class IsrSettlementService {

  // ── Overall list (Settlement main page) ────────────────────────────────────

  async getList(params: {
    search?: string;
    region?: string;
    nearProvinsi?: string;
    nearCity?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = buildWhere(params);

    const [rows, total] = await Promise.all([
      prisma.isrLink.findMany({
        where,
        skip,
        take: limit,
        orderBy: { isr: 'asc' },
        select: {
          id: true,
          isr: true,
          licenseNumber: true,
          regionCode: true,
          regionName: true,
          nearSite: true,
          farSite: true,
          nearLatDecimal: true,
          nearLongDecimal: true,
          statusUc2Ne: true,
          statusUc2Fe: true,
          statusKombinasiNeFe: true,
          statusUc1PotensiNe: true,
          statusUc1PotensiFe: true,
          matchTxNe: true,
          matchRxFe: true,
          matchBw: true,
          ruleCompliance: true,
          invNoInvoice: true,
          invStatusInvoice: true,
          invNilaiInvoice: true,
          invNilaiBayar: true,
        },
      }),
      prisma.isrLink.count({ where }),
    ]);

    const data = rows.map((r) => ({
      id: r.id,
      isrValue: r.isr.toString(),
      licenseNumber: r.licenseNumber?.toString() ?? '',
      region: r.regionName ?? r.regionCode ?? '',
      regionCode: r.regionCode ?? '',
      nearSite: r.nearSite ?? '',
      farSite: r.farSite ?? '',
      isrCoord: { lat: r.nearLatDecimal ?? 0, lng: r.nearLongDecimal ?? 0 },
      status: deriveOverallStatus(r as any),
      isrVsMdrs: deriveIsrVsMdrs(r as any),
      isrVsPotency: deriveIsrVsPotency(r as any),
      radioFrequency: deriveRadioFrequency(r as any),
      bwDistance: deriveBwDistance(r.ruleCompliance),
      sppReleases: r.invNoInvoice ? 'Released' : 'Not Released',
      sppPayment: r.invStatusInvoice ? r.invStatusInvoice : 'N/A',
      isrReleases: r.invNilaiInvoice && r.invNilaiBayar && r.invNilaiBayar >= r.invNilaiInvoice
        ? 'Released'
        : 'Not Released',
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Summary cards ───────────────────────────────────────────────────────────

  async getSummary() {
    const total = await prisma.isrLink.count();

    const [mdrsComply, potencyMatch, bwComply] = await Promise.all([
      prisma.isrLink.count({ where: { statusKombinasiNeFe: { contains: 'PERFECT MATCH' } } }),
      prisma.isrLink.count({
        where: {
          statusUc1PotensiNe: { contains: 'MATCH' },
          statusUc1PotensiFe: { contains: 'MATCH' },
        },
      }),
      prisma.isrLink.count({ where: { ruleCompliance: { contains: 'COMPLIANT' } } }),
    ]);

    const radioComply = await prisma.isrLink.count({
      where: { matchTxNe: true, matchRxFe: true, matchBw: true },
    });

    const withInvoice = await prisma.isrLink.count({
      where: { invNoInvoice: { not: null } },
    });

    const paid = await prisma.isrLink.count({
      where: { invStatusInvoice: { contains: 'PAID', mode: 'insensitive' } },
    });

    return {
      totalLinks: total,
      isrMdrs: {
        comply: mdrsComply,
        total,
        pct: total > 0 ? Math.round((mdrsComply / total) * 100) : 0,
        description: `${mdrsComply.toLocaleString('id-ID')} of ${total.toLocaleString('id-ID')} Links`,
      },
      isrPotency: {
        comply: potencyMatch,
        total,
        pct: total > 0 ? Math.round((potencyMatch / total) * 100) : 0,
        description: `${potencyMatch.toLocaleString('id-ID')} of ${total.toLocaleString('id-ID')} Links`,
      },
      radioFrequency: {
        comply: radioComply,
        total,
        pct: total > 0 ? Math.round((radioComply / total) * 100) : 0,
        description: `${radioComply.toLocaleString('id-ID')} of ${total.toLocaleString('id-ID')} Links`,
      },
      bwDistance: {
        comply: bwComply,
        total,
        pct: total > 0 ? Math.round((bwComply / total) * 100) : 0,
        description: `${bwComply.toLocaleString('id-ID')} of ${total.toLocaleString('id-ID')} Links`,
      },
      sppReleases: {
        comply: withInvoice,
        total,
        pct: total > 0 ? Math.round((withInvoice / total) * 100) : 0,
        description: `${withInvoice.toLocaleString('id-ID')} of ${total.toLocaleString('id-ID')} Links`,
      },
      sppPayment: {
        comply: paid,
        total,
        pct: total > 0 ? Math.round((paid / total) * 100) : 0,
        description: `${paid.toLocaleString('id-ID')} of ${total.toLocaleString('id-ID')} Links`,
      },
      isrReleases: {
        comply: paid,
        total,
        pct: total > 0 ? Math.round((paid / total) * 100) : 0,
        description: `${paid.toLocaleString('id-ID')} of ${total.toLocaleString('id-ID')} Links`,
      },
    };
  }

  // ── Filter options ──────────────────────────────────────────────────────────

  async getFilterOptions() {
    const [regions, provinces, cities] = await Promise.all([
      prisma.isrLink.findMany({
        select: { regionCode: true, regionName: true },
        distinct: ['regionName'],
        where: { regionName: { not: null } },
        orderBy: { regionName: 'asc' },
      }),
      prisma.isrLink.findMany({
        select: { nearProvinsi: true },
        distinct: ['nearProvinsi'],
        where: { nearProvinsi: { not: null } },
        orderBy: { nearProvinsi: 'asc' },
      }),
      prisma.isrLink.findMany({
        select: { nearCity: true },
        distinct: ['nearCity'],
        where: { nearCity: { not: null } },
        orderBy: { nearCity: 'asc' },
      }),
    ]);

    return {
      regions: regions.map(r => ({ code: r.regionCode, name: r.regionName })),
      provinces: provinces.map(r => r.nearProvinsi).filter(Boolean),
      cities: cities.map(r => r.nearCity).filter(Boolean),
    };
  }

  // ── ISR vs MDRS analysis ────────────────────────────────────────────────────

  async getIsrMdrsAnalysis(params: {
    region?: string;
    nearProvinsi?: string;
    nearCity?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = buildWhere(params);

    const [rows, total] = await Promise.all([
      prisma.isrLink.findMany({
        where,
        skip,
        take: limit,
        orderBy: { isr: 'asc' },
        select: {
          id: true,
          isr: true,
          licenseNumber: true,
          regionName: true,
          regionCode: true,
          nearSite: true,
          farSite: true,
          nearLatDecimal: true,
          nearLongDecimal: true,
          farLatDecimal: true,
          farLongDecimal: true,
          mdrsNeLongitude: true,
          mdrsNeLatitude: true,
          mdrsFeLongitude: true,
          mdrsFeLatitude: true,
          jarakDeviasiNeMeter: true,
          jarakDeviasiFeMeter: true,
          statusUc2Ne: true,
          statusUc2Fe: true,
          statusKombinasiNeFe: true,
          tipeAnomalyNe: true,
          tipeAnomalyFe: true,
        },
      }),
      prisma.isrLink.count({ where }),
    ]);

    // Region anomaly aggregation
    const regionAgg = await prisma.isrLink.groupBy({
      by: ['regionName'],
      where,
      _count: { id: true },
    });

    const regionAnomaly = await prisma.isrLink.groupBy({
      by: ['regionName'],
      where: {
        ...where,
        NOT: { statusKombinasiNeFe: { contains: 'PERFECT MATCH' } },
        statusKombinasiNeFe: { not: null },
      },
      _count: { id: true },
    });

    const regionAnomalyMap = new Map(regionAnomaly.map(r => [r.regionName, r._count.id]));
    const regionStats = regionAgg
      .filter(r => r.regionName)
      .map(r => {
        const anomalyCount = regionAnomalyMap.get(r.regionName) ?? 0;
        const totalLinks = r._count.id;
        const pct = totalLinks > 0 ? (anomalyCount / totalLinks) * 100 : 0;
        return {
          region: r.regionName,
          totalLinks,
          anomaly: anomalyCount,
          deviation: `${pct.toFixed(1)}%`,
        };
      })
      .sort((a, b) => b.anomaly - a.anomaly);

    // Overview
    const neAndFeComply = rows.filter(r => deriveIsrVsMdrs(r as any) === 'NE & FE Comply').length;
    const partial = rows.filter(r => deriveIsrVsMdrs(r as any) === 'Partial').length;
    const notComply = rows.filter(r => deriveIsrVsMdrs(r as any) === 'Not Comply').length;
    const missing = rows.filter(r => deriveIsrVsMdrs(r as any) === 'Missing Data').length;

    const data = rows.map(r => ({
      id: r.id,
      isrValue: r.isr.toString(),
      licenseNumber: r.licenseNumber?.toString() ?? '',
      region: r.regionName ?? '',
      regionCode: r.regionCode ?? '',
      nearSite: r.nearSite ?? '',
      farSite: r.farSite ?? '',
      isrCoord: { lat: r.nearLatDecimal ?? 0, lng: r.nearLongDecimal ?? 0 },
      isrNear: `${r.nearLatDecimal ?? 0}, ${r.nearLongDecimal ?? 0}`,
      mdrsNear: r.mdrsNeLatitude && r.mdrsNeLongitude
        ? `${r.mdrsNeLatitude}, ${r.mdrsNeLongitude}` : 'N/A',
      deltaNearM: r.jarakDeviasiNeMeter?.toFixed(2) ?? 'N/A',
      isrFar: `${r.farLatDecimal ?? 0}, ${r.farLongDecimal ?? 0}`,
      mdrsFar: r.mdrsFeLatitude && r.mdrsFeLongitude
        ? `${r.mdrsFeLatitude}, ${r.mdrsFeLongitude}` : 'N/A',
      deltaFarM: r.jarakDeviasiFeMeter?.toFixed(2) ?? 'N/A',
      status: deriveIsrVsMdrs(r as any),
      tipeAnomalyNe: r.tipeAnomalyNe ?? '',
      tipeAnomalyFe: r.tipeAnomalyFe ?? '',
    }));

    return {
      data,
      overview: {
        neAndFeComply,
        partial,
        notComply,
        missing,
        total: rows.length,
      },
      regionStats,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── ISR vs Potency analysis ─────────────────────────────────────────────────

  async getIsrPotencyAnalysis(params: {
    region?: string;
    nearProvinsi?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = buildWhere(params);

    const [rows, total] = await Promise.all([
      prisma.isrLink.findMany({
        where,
        skip,
        take: limit,
        orderBy: { isr: 'asc' },
        select: {
          id: true,
          isr: true,
          licenseNumber: true,
          regionName: true,
          regionCode: true,
          nearSite: true,
          farSite: true,
          nearLatDecimal: true,
          nearLongDecimal: true,
          farLatDecimal: true,
          farLongDecimal: true,
          potLatNe: true,
          potLongNe: true,
          potLatFe: true,
          potLongFe: true,
          distIsrPotensiNeMeter: true,
          distIsrPotensiFeMeter: true,
          statusUc1PotensiNe: true,
          statusUc1PotensiFe: true,
          statusRadiusNe: true,
          statusRadiusFe: true,
        },
      }),
      prisma.isrLink.count({ where }),
    ]);

    const regionAgg = await prisma.isrLink.groupBy({
      by: ['regionName'],
      where,
      _count: { id: true },
    });

    const regionAnomaly = await prisma.isrLink.groupBy({
      by: ['regionName'],
      where: {
        ...where,
        OR: [
          { statusUc1PotensiNe: { contains: 'UNMATCH' } },
          { statusUc1PotensiFe: { contains: 'UNMATCH' } },
        ],
      },
      _count: { id: true },
    });

    const regionAnomalyMap = new Map(regionAnomaly.map(r => [r.regionName, r._count.id]));
    const regionStats = regionAgg
      .filter(r => r.regionName)
      .map(r => {
        const anomalyCount = regionAnomalyMap.get(r.regionName) ?? 0;
        const totalLinks = r._count.id;
        return {
          region: r.regionName,
          totalLinks,
          anomaly: anomalyCount,
          deviation: `${totalLinks > 0 ? ((anomalyCount / totalLinks) * 100).toFixed(1) : 0}%`,
        };
      })
      .sort((a, b) => b.anomaly - a.anomaly);

    const neAndFeMatch = rows.filter(r => deriveIsrVsPotency(r as any) === 'NE & FE Match').length;
    const partial = rows.filter(r => deriveIsrVsPotency(r as any) === 'Partial').length;
    const mismatch = rows.filter(r => deriveIsrVsPotency(r as any) === 'Mismatch').length;
    const noData = rows.filter(r => deriveIsrVsPotency(r as any) === 'No Data').length;

    const data = rows.map(r => ({
      id: r.id,
      isrValue: r.isr.toString(),
      licenseNumber: r.licenseNumber?.toString() ?? '',
      region: r.regionName ?? '',
      regionCode: r.regionCode ?? '',
      nearSite: r.nearSite ?? '',
      farSite: r.farSite ?? '',
      isrCoord: { lat: r.nearLatDecimal ?? 0, lng: r.nearLongDecimal ?? 0 },
      isrNearCoord: `${r.nearLatDecimal ?? 0}, ${r.nearLongDecimal ?? 0}`,
      potencyNearCoord: r.potLatNe && r.potLongNe ? `${r.potLatNe}, ${r.potLongNe}` : 'N/A',
      distNeMeter: r.distIsrPotensiNeMeter?.toFixed(2) ?? 'N/A',
      isrFarCoord: `${r.farLatDecimal ?? 0}, ${r.farLongDecimal ?? 0}`,
      potencyFarCoord: r.potLatFe && r.potLongFe ? `${r.potLatFe}, ${r.potLongFe}` : 'N/A',
      distFeMeter: r.distIsrPotensiFeMeter?.toFixed(2) ?? 'N/A',
      statusNe: r.statusUc1PotensiNe ?? '',
      statusFe: r.statusUc1PotensiFe ?? '',
      statusRadiusNe: r.statusRadiusNe ?? '',
      statusRadiusFe: r.statusRadiusFe ?? '',
      status: deriveIsrVsPotency(r as any),
    }));

    return {
      data,
      overview: { neAndFeMatch, partial, mismatch, noData, total: rows.length },
      regionStats,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Radio Frequency analysis ────────────────────────────────────────────────

  async getRadioFrequencyAnalysis(params: {
    region?: string;
    nearProvinsi?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = buildWhere(params);

    const [rows, total] = await Promise.all([
      prisma.isrLink.findMany({
        where,
        skip,
        take: limit,
        orderBy: { isr: 'asc' },
        select: {
          id: true,
          isr: true,
          licenseNumber: true,
          regionName: true,
          regionCode: true,
          nearSite: true,
          farSite: true,
          nearLatDecimal: true,
          nearLongDecimal: true,
          freqTx: true,
          freqRx: true,
          bandwidth: true,
          potFrekNe: true,
          potFrekFe: true,
          potBw: true,
          matchTxNe: true,
          matchRxFe: true,
          matchBw: true,
          spectrumStatus: true,
          finalValidationStatus: true,
        },
      }),
      prisma.isrLink.count({ where }),
    ]);

    const freqAndBwMatch = rows.filter(r => deriveRadioFrequency(r as any) === 'Freq. & BW Match').length;
    const freqMismatch = rows.filter(r => deriveRadioFrequency(r as any) === 'Frequency Mismatch').length;
    const bwMismatch = rows.filter(r => deriveRadioFrequency(r as any) === 'BW Mismatch').length;
    const freqAndBwMismatch = rows.filter(r => deriveRadioFrequency(r as any) === 'Freq. & BW Mismatch').length;

    const data = rows.map(r => ({
      id: r.id,
      isrValue: r.isr.toString(),
      licenseNumber: r.licenseNumber?.toString() ?? '',
      region: r.regionName ?? '',
      regionCode: r.regionCode ?? '',
      nearSite: r.nearSite ?? '',
      farSite: r.farSite ?? '',
      isrCoord: { lat: r.nearLatDecimal ?? 0, lng: r.nearLongDecimal ?? 0 },
      actualFreqTxRx: `${r.freqTx ?? ''} / ${r.freqRx ?? ''}`,
      potFreqTxRx: r.potFrekNe || r.potFrekFe
        ? `${r.potFrekNe ?? '-'} / ${r.potFrekFe ?? '-'}` : 'N/A',
      actualBw: r.bandwidth?.toString() ?? 'N/A',
      potBw: r.potBw?.toString() ?? 'N/A',
      matchTxNe: r.matchTxNe,
      matchRxFe: r.matchRxFe,
      matchBw: r.matchBw,
      spectrumStatus: r.spectrumStatus ?? '',
      finalValidationStatus: r.finalValidationStatus ?? '',
      frequencyStatus: deriveRadioFrequency(r as any),
    }));

    return {
      data,
      overview: {
        freqAndBwMatch,
        frequencyMismatch: freqMismatch,
        bwMismatch,
        freqAndBwMismatch,
        totalLinks: rows.length,
      },
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── BW Distance analysis ────────────────────────────────────────────────────

  async getBwDistanceAnalysis(params: {
    region?: string;
    nearProvinsi?: string;
    bandCategory?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = buildWhere(params);

    const [rows, total] = await Promise.all([
      prisma.isrLink.findMany({
        where,
        skip,
        take: limit,
        orderBy: { isr: 'asc' },
        select: {
          id: true,
          isr: true,
          licenseNumber: true,
          regionName: true,
          regionCode: true,
          nearSite: true,
          farSite: true,
          nearLatDecimal: true,
          nearLongDecimal: true,
          freqTx: true,
          freqRx: true,
          freqGhz: true,
          bandCategory: true,
          linkDistanceKm: true,
          minDistanceKm: true,
          maxDistanceKm: true,
          distanceGapKm: true,
          jarakDeviasiNeMeter: true,
          ruleCompliance: true,
        },
      }),
      prisma.isrLink.count({ where }),
    ]);

    // Band anomaly aggregation
    const bandAgg = await prisma.isrLink.groupBy({
      by: ['bandCategory'],
      where: { bandCategory: { not: null } },
      _count: { id: true },
    });

    const bandCompliant = await prisma.isrLink.groupBy({
      by: ['bandCategory'],
      where: {
        bandCategory: { not: null },
        ruleCompliance: { contains: 'COMPLIANT' },
      },
      _count: { id: true },
    });

    const bandStats = await Promise.all(
      bandAgg
        .filter(b => b.bandCategory)
        .map(async (b) => {
          const compliantCount = bandCompliant.find(bc => bc.bandCategory === b.bandCategory)?._count.id ?? 0;
          const sample = await prisma.isrLink.findFirst({
            where: { bandCategory: b.bandCategory },
            select: { minDistanceKm: true, maxDistanceKm: true },
          });
          return {
            freqBand: b.bandCategory,
            totalLinks: b._count.id,
            minDistanceRule: sample?.minDistanceKm?.toString() ?? 'N/A',
            maxDistanceRule: sample?.maxDistanceKm?.toString() ?? 'N/A',
            compliant: compliantCount,
            anomaly: b._count.id - compliantCount,
          };
        })
    );

    // Region anomaly aggregation
    const regionAgg = await prisma.isrLink.groupBy({ by: ['regionName'], where, _count: { id: true } });
    const regionAnomaly = await prisma.isrLink.groupBy({
      by: ['regionName'],
      where: { ...where, ruleCompliance: { not: { contains: 'COMPLIANT' } } },
      _count: { id: true },
    });

    const regionAnomalyMap = new Map(regionAnomaly.map(r => [r.regionName, r._count.id]));
    const regionStats = regionAgg
      .filter(r => r.regionName)
      .map(r => {
        const anomalyCount = regionAnomalyMap.get(r.regionName) ?? 0;
        const totalLinks = r._count.id;
        return {
          region: r.regionName,
          totalLinks,
          anomaly: anomalyCount,
          deviation: `${totalLinks > 0 ? ((anomalyCount / totalLinks) * 100).toFixed(1) : 0}%`,
        };
      })
      .sort((a, b) => b.anomaly - a.anomaly);

    const comply = rows.filter(r => deriveBwDistance(r.ruleCompliance) === 'Comply').length;
    const notComply = rows.filter(r => deriveBwDistance(r.ruleCompliance) === 'Not Comply').length;

    const data = rows.map(r => ({
      id: r.id,
      isrValue: r.isr.toString(),
      licenseNumber: r.licenseNumber?.toString() ?? '',
      region: r.regionName ?? '',
      regionCode: r.regionCode ?? '',
      nearSite: r.nearSite ?? '',
      farSite: r.farSite ?? '',
      isrCoord: { lat: r.nearLatDecimal ?? 0, lng: r.nearLongDecimal ?? 0 },
      actualFreqTxRx: `${r.freqTx ?? ''} / ${r.freqRx ?? ''}`,
      freqBand: r.bandCategory ?? 'N/A',
      linkDistanceKm: r.linkDistanceKm?.toFixed(4) ?? 'N/A',
      minDistance: r.minDistanceKm?.toFixed(4) ?? 'N/A',
      maxDistance: r.maxDistanceKm?.toFixed(4) ?? 'N/A',
      distanceGap: r.distanceGapKm?.toFixed(4) ?? 'N/A',
      deltaNeM: r.jarakDeviasiNeMeter?.toFixed(3) ?? 'N/A',
      bwDistanceStatus: deriveBwDistance(r.ruleCompliance) as 'Comply' | 'Not Comply',
      anomaly: r.ruleCompliance?.includes('COMPLIANT') ? '0' : '1',
      status: deriveBwDistance(r.ruleCompliance),
      bwDistance: deriveBwDistance(r.ruleCompliance),
    }));

    return {
      data,
      overview: { comply, notComply, partial: 0, total: rows.length },
      bandStats,
      regionStats,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Invoice list ────────────────────────────────────────────────────────────

  async getInvoiceList(params: {
    region?: string;
    search?: string;
    invStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.IsrLinkWhereInput = {
      invNoInvoice: { not: null },
    };

    if (params.region && params.region !== 'All Region') {
      where.regionName = { contains: params.region, mode: 'insensitive' };
    }
    if (params.invStatus && params.invStatus !== 'all') {
      where.invStatusInvoice = { contains: params.invStatus, mode: 'insensitive' };
    }
    if (params.search) {
      where.OR = [
        { nearSite: { contains: params.search, mode: 'insensitive' } },
        { farSite: { contains: params.search, mode: 'insensitive' } },
        { invNoInvoice: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.isrLink.findMany({
        where,
        skip,
        take: limit,
        orderBy: { isr: 'asc' },
        select: {
          id: true,
          isr: true,
          licenseNumber: true,
          regionName: true,
          nearSite: true,
          farSite: true,
          invId: true,
          invNoInvoice: true,
          invNoRr: true,
          invNilaiInvoice: true,
          invNilaiBayar: true,
          invStatusInvoice: true,
          invPeriodeAwal: true,
          invPeriodeAkhir: true,
          invTanggalTerbit: true,
          invJatuhTempo: true,
          invTanggalBayar: true,
          invTipeInvoice: true,
        },
      }),
      prisma.isrLink.count({ where }),
    ]);

    const data = rows.map(r => ({
      id: r.id,
      isrValue: r.isr.toString(),
      licenseNumber: r.licenseNumber?.toString() ?? '',
      region: r.regionName ?? '',
      nearSite: r.nearSite ?? '',
      farSite: r.farSite ?? '',
      invId: r.invId,
      invNoInvoice: r.invNoInvoice,
      invNoRr: r.invNoRr,
      invNilaiInvoice: r.invNilaiInvoice,
      invNilaiBayar: r.invNilaiBayar,
      invStatusInvoice: r.invStatusInvoice,
      invPeriodeAwal: r.invPeriodeAwal,
      invPeriodeAkhir: r.invPeriodeAkhir,
      invTanggalTerbit: r.invTanggalTerbit,
      invJatuhTempo: r.invJatuhTempo,
      invTanggalBayar: r.invTanggalBayar,
      invTipeInvoice: r.invTipeInvoice,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

export const isrSettlementService = new IsrSettlementService();
