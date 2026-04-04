import { db } from '@/lib/db'
import { hash } from 'bcryptjs'
import type {
  Agency,
  SmeClient,
  User,
  DataSource,
  Pipeline,
  Dashboard,
  Widget,
  Report,
} from '@prisma/client'

function json(obj: unknown): string {
  return JSON.stringify(obj)
}

// deterministic PRNG so seed data is reproducible across runs
function seededRandom(seed: string): () => number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  }
  return () => {
    h = (h ^ (h >>> 16)) * 0x45d9f3b
    h = (h ^ (h >>> 16)) * 0x45d9f3b
    h = h ^ (h >>> 16)
    return (h >>> 0) / 0x100000000
  }
}

// generates the past N days ending 2025-06-13 (hardcoded so seed is stable)
function pastDates(days: number): string[] {
  const dates: string[] = []
  const end = new Date('2025-06-13')
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function monthLabel(dateStr: string): string {
  // used in report generation for french-friendly date labels
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
  ]
  const m = parseInt(dateStr.slice(5, 7), 10)
  const d = parseInt(dateStr.slice(8, 10), 10)
  return `${months[m - 1]} ${d}`
}

// seasonal patterns: higher around Dec (holiday shopping), lower Jan/Aug
function seasonalMultiplier(dateStr: string): number {
  const m = parseInt(dateStr.slice(5, 7), 10)
  // Baseline 1.0, bump in Nov-Dec, dip in Jan-Aug
  const table: Record<number, number> = {
    1: 0.75, 2: 0.80, 3: 0.85, 4: 0.90, 5: 0.95,
    6: 0.95, 7: 0.80, 8: 0.75, 9: 0.90, 10: 1.00,
    11: 1.15, 12: 1.30,
  }
  return table[m] ?? 1.0
}

// restaurant-specific: weekends are busy, mondays dead
function restaurantDayMultiplier(dateStr: string): number {
  const dow = new Date(dateStr).getDay() // 0=Sun
  const table: Record<number, number> = {
    0: 1.10, 1: 0.70, 2: 0.85, 3: 0.90, 4: 0.95, 5: 1.15, 6: 1.30,
  }
  return table[dow] ?? 1.0
}

// BTP/construction: no work on weekends
function btpDayMultiplier(dateStr: string): number {
  const dow = new Date(dateStr).getDay()
  return dow === 0 || dow === 6 ? 0.0 : 1.0
}

// adds ±20% random noise so the data doesn't look suspiciously flat
function jitter(rng: () => number, value: number): number {
  return value * (0.8 + rng() * 0.4)
}

interface DataPoint {
  rowCategory: string
  rowMetric: string
  baseValue: number
}

function buildGenerator(
  points: DataPoint[],
  dateMultiplier: (d: string) => number,
): (dateStr: string, rng: () => number) => Array<{
  rowCategory: string
  rowMetric: string
  rowValue: number
}> {
  return (dateStr: string, rng: () => number) => {
    const dm = dateMultiplier(dateStr)
    return points.map((p) => ({
      rowCategory: p.rowCategory,
      rowMetric: p.rowMetric,
      rowValue: Math.round(jitter(rng, p.baseValue * dm) * 100) / 100,
    }))
  }
}

const defaultDateMul = (d: string) => seasonalMultiplier(d)
const weekendMul = (d: string) =>
  seasonalMultiplier(d) * restaurantDayMultiplier(d)
const weekdayMul = (d: string) =>
  seasonalMultiplier(d) * btpDayMultiplier(d)

const retailGenerator = buildGenerator(
  [
    { rowCategory: 'Ventes', rowMetric: 'montant', baseValue: 2450 },
    { rowCategory: 'Transactions', rowMetric: 'count', baseValue: 68 },
    { rowCategory: 'Panier moyen', rowMetric: 'avg', baseValue: 36 },
  ],
  defaultDateMul,
)

const restaurantGenerator = buildGenerator(
  [
    { rowCategory: 'Couverts', rowMetric: 'count', baseValue: 85 },
    { rowCategory: 'Chiffre d\'affaires', rowMetric: 'montant', baseValue: 2100 },
    { rowCategory: 'Ticket moyen', rowMetric: 'avg', baseValue: 24.5 },
    { rowCategory: 'Taux d\'occupation', rowMetric: 'percent', baseValue: 72 },
  ],
  weekendMul,
)

const btpGenerator = buildGenerator(
  [
    { rowCategory: 'Projets actifs', rowMetric: 'count', baseValue: 5 },
    { rowCategory: 'Heures travaillées', rowMetric: 'hours', baseValue: 160 },
    { rowCategory: 'Coût matériaux', rowMetric: 'montant', baseValue: 3200 },
  ],
  weekdayMul,
)

const healthcareGenerator = buildGenerator(
  [
    { rowCategory: 'Patients', rowMetric: 'count', baseValue: 45 },
    { rowCategory: 'Consultations', rowMetric: 'count', baseValue: 38 },
    { rowCategory: 'Ordonnances', rowMetric: 'count', baseValue: 32 },
  ],
  defaultDateMul,
)

const ecommerceGenerator = buildGenerator(
  [
    { rowCategory: 'Commandes', rowMetric: 'count', baseValue: 42 },
    { rowCategory: 'Chiffre d\'affaires', rowMetric: 'montant', baseValue: 3800 },
    { rowCategory: 'Taux de conversion', rowMetric: 'percent', baseValue: 3.2 },
    { rowCategory: 'Valeur moyenne commande', rowMetric: 'avg', baseValue: 89 },
  ],
  defaultDateMul,
)

const automotiveGenerator = buildGenerator(
  [
    { rowCategory: 'Réparations', rowMetric: 'count', baseValue: 12 },
    { rowCategory: 'Pièces vendues', rowMetric: 'count', baseValue: 28 },
    { rowCategory: 'Heures de travail', rowMetric: 'hours', baseValue: 35 },
  ],
  weekdayMul,
)

const logisticsGenerator = buildGenerator(
  [
    { rowCategory: 'Colis expédiés', rowMetric: 'count', baseValue: 220 },
    { rowCategory: 'Livraisons', rowMetric: 'count', baseValue: 215 },
    { rowCategory: 'Temps de transit moyen', rowMetric: 'hours', baseValue: 48 },
  ],
  defaultDateMul,
)

const servicesGenerator = buildGenerator(
  [
    { rowCategory: 'Heures facturées', rowMetric: 'hours', baseValue: 22 },
    { rowCategory: 'Projets actifs', rowMetric: 'count', baseValue: 8 },
    { rowCategory: 'Factures émises', rowMetric: 'count', baseValue: 3 },
    { rowCategory: 'CA facturé', rowMetric: 'montant', baseValue: 4200 },
  ],
  weekdayMul,
)

interface SmeDefinition {
  name: string
  slug: string
  industry: string
  status: 'active' | 'trial'
  contactName: string
  contactEmail: string
  contactPhone: string
  userEmail: string
  userName: string
  dataSources: Array<{
    name: string
    connectorType: string
    description: string
  }>
  pipelines: Array<{
    name: string
    description: string
    status: 'active' | 'draft' | 'paused'
  }>
  dashboards: Array<{
    name: string
    description: string
    widgets: Array<{
      widgetType: string
      title: string
      subtitle: string
      category: string
      metric: string
      aggregation: string
    }>
  }>
  report: { name: string; description: string }
  generator: (dateStr: string, rng: () => number) => Array<{
    rowCategory: string
    rowMetric: string
    rowValue: number
  }>
}

const smeDefinitions: SmeDefinition[] = [
  {
    name: 'Boulangerie Dupont',
    slug: 'boulangerie-dupont',
    industry: 'retail',
    status: 'active',
    contactName: 'Marie Dupont',
    contactEmail: 'contact@boulangerie-dupont.com',
    contactPhone: '+33 1 42 68 53 01',
    userEmail: 'contact@boulangerie-dupont.com',
    userName: 'Marie Dupont',
    dataSources: [
      { name: 'Ventes Journalières', connectorType: 'csv_upload', description: 'Export quotidien des ventes caisse' },
      { name: 'Stock Produits', connectorType: 'excel_upload', description: 'Inventaire des produits en stock' },
      { name: 'Commandes Fournisseurs', connectorType: 'google_sheets', description: 'Suivi des commandes fournisseurs' },
    ],
    pipelines: [
      { name: 'Pipeline Ventes Quotidiennes', description: 'Agrégation des ventes journalières et métriques de performance', status: 'active' },
      { name: 'Analyse Stock (brouillon)', description: 'Analyse des niveaux de stock et réapprovisionnement', status: 'draft' },
    ],
    dashboards: [
      {
        name: 'Tableau de Bord Ventes',
        description: 'Vue d\'ensemble des performances commerciales',
        widgets: [
          { widgetType: 'kpi_card', title: 'CA du jour', subtitle: 'Chiffre d\'affaires', category: 'Ventes', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Transactions', subtitle: 'Nombre de transactions', category: 'Transactions', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Panier moyen', subtitle: 'Montant moyen par client', category: 'Panier moyen', metric: 'avg', aggregation: 'avg' },
          { widgetType: 'line_chart', title: 'Évolution du CA', subtitle: '30 derniers jours', category: 'Ventes', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'bar_chart', title: 'Transactions par jour', subtitle: 'Volume quotidien', category: 'Transactions', metric: 'count', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Panier moyen tendance', subtitle: 'Évolution sur 30j', category: 'Panier moyen', metric: 'avg', aggregation: 'avg' },
          { widgetType: 'pie_chart', title: 'Répartition ventes', subtitle: 'Par catégorie', category: 'Ventes', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'data_table', title: 'Détail quotidien', subtitle: 'Données brutes', category: 'Ventes', metric: 'montant', aggregation: 'sum' },
        ],
      },
      {
        name: 'Performance Hebdomadaire',
        description: 'Analyse des tendances hebdomadaires',
        widgets: [
          { widgetType: 'kpi_card', title: 'CA hebdo', subtitle: 'Semaine en cours', category: 'Ventes', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'bar_chart', title: 'Ventes par jour de semaine', subtitle: 'Comparaison jours', category: 'Ventes', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'line_chart', title: 'Tendance 90 jours', subtitle: 'CA sur 3 mois', category: 'Ventes', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Volume transactions', subtitle: '90 jours', category: 'Transactions', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Moyenne hebdo', subtitle: 'Panier moyen semaine', category: 'Panier moyen', metric: 'avg', aggregation: 'avg' },
          { widgetType: 'pie_chart', title: 'Répartition métriques', subtitle: 'Catégories', category: 'Ventes', metric: 'montant', aggregation: 'sum' },
        ],
      },
    ],
    report: { name: 'Rapport Hebdomadaire - Boulangerie Dupont', description: 'Synthèse des performances de la semaine' },
    generator: retailGenerator,
  },
  {
    name: 'Le Petit Bistrot',
    slug: 'le-petit-bistrot',
    industry: 'restaurant',
    status: 'active',
    contactName: 'Jean-Pierre Moreau',
    contactEmail: 'contact@le-petit-bistrot.com',
    contactPhone: '+33 1 43 26 18 00',
    userEmail: 'contact@le-petit-bistrot.com',
    userName: 'Jean-Pierre Moreau',
    dataSources: [
      { name: 'Notes de caisse', connectorType: 'woocommerce', description: 'Système de caisse restaurant' },
      { name: 'Réservations', connectorType: 'rest_api', description: 'API réservations en ligne' },
      { name: 'Comptabilité', connectorType: 'quickbooks', description: 'Export comptable QuickBooks' },
      { name: 'Menu & Prix', connectorType: 'google_sheets', description: 'Feuille de calcul des menus et tarifs' },
    ],
    pipelines: [
      { name: 'Pipeline Restaurant', description: 'Suivi des couverts, CA et performance service', status: 'active' },
      { name: 'Analyse Menu (brouillon)', description: 'Analyse de rentabilité par plat', status: 'draft' },
    ],
    dashboards: [
      {
        name: 'Suivi Restaurant',
        description: 'Tableau de bord opérationnel du restaurant',
        widgets: [
          { widgetType: 'kpi_card', title: 'Couverts du jour', subtitle: 'Total couverts', category: 'Couverts', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'CA journalier', subtitle: 'Chiffre d\'affaires', category: 'Chiffre d\'affaires', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Ticket moyen', subtitle: 'Par couvert', category: 'Ticket moyen', metric: 'avg', aggregation: 'avg' },
          { widgetType: 'kpi_card', title: 'Taux d\'occupation', subtitle: '% salle remplie', category: 'Taux d\'occupation', metric: 'percent', aggregation: 'avg' },
          { widgetType: 'line_chart', title: 'CA sur 30 jours', subtitle: 'Tendance', category: 'Chiffre d\'affaires', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'bar_chart', title: 'Couverts par jour', subtitle: 'Volume', category: 'Couverts', metric: 'count', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Occupation salle', subtitle: 'Tendance 30j', category: 'Taux d\'occupation', metric: 'percent', aggregation: 'avg' },
          { widgetType: 'pie_chart', title: 'Répartition CA', subtitle: 'Par jour', category: 'Chiffre d\'affaires', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'data_table', title: 'Détail journalier', subtitle: 'Toutes les métriques', category: 'Couverts', metric: 'count', aggregation: 'sum' },
          { widgetType: 'line_chart', title: 'Évolution ticket moyen', subtitle: '30 derniers jours', category: 'Ticket moyen', metric: 'avg', aggregation: 'avg' },
        ],
      },
      {
        name: 'Tendances Hebdomadaires',
        description: 'Analyse des performances par jour de la semaine',
        widgets: [
          { widgetType: 'bar_chart', title: 'CA par jour semaine', subtitle: 'Moyenne par jour', category: 'Chiffre d\'affaires', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'line_chart', title: 'Couverts tendance', subtitle: '90 jours', category: 'Couverts', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'CA hebdomadaire', subtitle: 'Total semaine', category: 'Chiffre d\'affaires', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Meilleur jour', subtitle: 'Couverts max', category: 'Couverts', metric: 'count', aggregation: 'max' },
          { widgetType: 'pie_chart', title: 'Répartition couverts', subtitle: 'Par jour', category: 'Couverts', metric: 'count', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Ticket moyen hebdo', subtitle: 'Tendance', category: 'Ticket moyen', metric: 'avg', aggregation: 'avg' },
        ],
      },
    ],
    report: { name: 'Bilan Hebdomadaire - Le Petit Bistrot', description: 'Rapport de performance restaurant hebdomadaire' },
    generator: restaurantGenerator,
  },
  {
    name: 'BTP Martin & Fils',
    slug: 'btp-martin-fils',
    industry: 'btp',
    status: 'trial',
    contactName: 'Pierre Martin',
    contactEmail: 'contact@btp-martin-fils.com',
    contactPhone: '+33 4 91 22 34 56',
    userEmail: 'contact@btp-martin-fils.com',
    userName: 'Pierre Martin',
    dataSources: [
      { name: 'Suivi Chantiers', connectorType: 'postgresql', description: 'Base de données chantiers' },
      { name: 'Feuille de paie', connectorType: 'excel_upload', description: 'Heures et salaires ouvriers' },
      { name: 'Factures fournisseurs', connectorType: 'csv_upload', description: 'Import factures matériaux' },
    ],
    pipelines: [
      { name: 'Pipeline Chantiers', description: 'Suivi des projets et coûts BTP', status: 'active' },
      { name: 'Analyse Rentabilité (brouillon)', description: 'Analyse de rentabilité par chantier', status: 'draft' },
    ],
    dashboards: [
      {
        name: 'Suivi Chantiers',
        description: 'Tableau de bord des opérations BTP',
        widgets: [
          { widgetType: 'kpi_card', title: 'Projets actifs', subtitle: 'Chantiers en cours', category: 'Projets actifs', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Heures travaillées', subtitle: 'Total heures équipe', category: 'Heures travaillées', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Coût matériaux', subtitle: 'Dépenses jour', category: 'Coût matériaux', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'bar_chart', title: 'Heures par jour', subtitle: 'Volume horaire', category: 'Heures travaillées', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'line_chart', title: 'Coût matériaux tendance', subtitle: '30 derniers jours', category: 'Coût matériaux', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Projets en cours', subtitle: 'Évolution', category: 'Projets actifs', metric: 'count', aggregation: 'sum' },
          { widgetType: 'data_table', title: 'Détail quotidien', subtitle: 'Toutes métriques', category: 'Heures travaillées', metric: 'hours', aggregation: 'sum' },
        ],
      },
      {
        name: 'Budget & Coûts',
        description: 'Suivi budgétaire des chantiers',
        widgets: [
          { widgetType: 'line_chart', title: 'Tendance coûts matériaux', subtitle: '90 jours', category: 'Coût matériaux', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'bar_chart', title: 'Heures semaine', subtitle: 'Par jour', category: 'Heures travaillées', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Coût total mois', subtitle: 'Matériaux', category: 'Coût matériaux', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'pie_chart', title: 'Répartition coûts', subtitle: 'Par catégorie', category: 'Coût matériaux', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Heures cumulées', subtitle: 'Tendance', category: 'Heures travaillées', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Coût moyen/jour', subtitle: 'Matériaux', category: 'Coût matériaux', metric: 'montant', aggregation: 'avg' },
        ],
      },
    ],
    report: { name: 'Rapport Chantiers - BTP Martin & Fils', description: 'Suivi des opérations et coûts de chantier' },
    generator: btpGenerator,
  },
  {
    name: 'Pharmacie Centrale',
    slug: 'pharmacie-centrale',
    industry: 'healthcare',
    status: 'active',
    contactName: 'Dr. Sophie Laurent',
    contactEmail: 'contact@pharmacie-centrale.com',
    contactPhone: '+33 1 45 67 89 01',
    userEmail: 'contact@pharmacie-centrale.com',
    userName: 'Dr. Sophie Laurent',
    dataSources: [
      { name: 'Logiciel Pharmacie', connectorType: 'rest_api', description: 'API du logiciel de gestion pharmacie' },
      { name: 'Ventes Médicaments', connectorType: 'csv_upload', description: 'Export quotidien des ventes' },
      { name: 'Stock Produits', connectorType: 'excel_upload', description: 'Inventaire pharmacie' },
    ],
    pipelines: [
      { name: 'Pipeline Pharmacie', description: 'Suivi patients et activité pharmaceutique', status: 'active' },
      { name: 'Gestion Stock (brouillon)', description: 'Analyse des niveaux de stock et péremptions', status: 'paused' },
    ],
    dashboards: [
      {
        name: 'Activité Pharmacie',
        description: 'Suivi quotidien de l\'activité pharmaceutique',
        widgets: [
          { widgetType: 'kpi_card', title: 'Patients du jour', subtitle: 'Patients reçus', category: 'Patients', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Consultations', subtitle: 'Nombre de consultations', category: 'Consultations', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Ordonnances', subtitle: 'Ordonnances traitées', category: 'Ordonnances', metric: 'count', aggregation: 'sum' },
          { widgetType: 'line_chart', title: 'Patients sur 30 jours', subtitle: 'Tendance', category: 'Patients', metric: 'count', aggregation: 'sum' },
          { widgetType: 'bar_chart', title: 'Consultations par jour', subtitle: 'Volume', category: 'Consultations', metric: 'count', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Ordonnances tendance', subtitle: '30 jours', category: 'Ordonnances', metric: 'count', aggregation: 'sum' },
          { widgetType: 'pie_chart', title: 'Répartition activité', subtitle: 'Par type', category: 'Patients', metric: 'count', aggregation: 'sum' },
          { widgetType: 'data_table', title: 'Détail quotidien', subtitle: 'Toutes métriques', category: 'Patients', metric: 'count', aggregation: 'sum' },
        ],
      },
      {
        name: 'Tendances Mensuelles',
        description: 'Vue mensuelle de l\'activité',
        widgets: [
          { widgetType: 'line_chart', title: 'Patients 90 jours', subtitle: 'Tendance longue', category: 'Patients', metric: 'count', aggregation: 'sum' },
          { widgetType: 'bar_chart', title: 'Consultations mensuelles', subtitle: 'Par mois', category: 'Consultations', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Total patients mois', subtitle: 'Cumul mensuel', category: 'Patients', metric: 'count', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Ordonnances cumulées', subtitle: 'Tendance', category: 'Ordonnances', metric: 'count', aggregation: 'sum' },
          { widgetType: 'pie_chart', title: 'Types de consultation', subtitle: 'Répartition', category: 'Consultations', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Moyenne journalière', subtitle: 'Patients/jour', category: 'Patients', metric: 'count', aggregation: 'avg' },
        ],
      },
    ],
    report: { name: 'Rapport Mensuel - Pharmacie Centrale', description: 'Bilan mensuel de l\'activité pharmaceutique' },
    generator: healthcareGenerator,
  },

  {
    name: 'TechShop Online',
    slug: 'techshop-online',
    industry: 'ecommerce',
    status: 'active',
    contactName: 'Lucas Bernard',
    contactEmail: 'contact@techshop-online.com',
    contactPhone: '+33 4 72 33 44 55',
    userEmail: 'contact@techshop-online.com',
    userName: 'Lucas Bernard',
    dataSources: [
      { name: 'WooCommerce', connectorType: 'woocommerce', description: 'Boutique en ligne WooCommerce' },
      { name: 'Google Analytics', connectorType: 'rest_api', description: 'Données de trafic et conversion' },
      { name: 'QuickBooks', connectorType: 'quickbooks', description: 'Comptabilité et facturation' },
      { name: 'Stock Entrepôt', connectorType: 'google_sheets', description: 'Suivi stock entrepôt' },
    ],
    pipelines: [
      { name: 'Pipeline E-commerce', description: 'Suivi des commandes, revenus et taux de conversion', status: 'active' },
      { name: 'Analyse Produits (brouillon)', description: 'Performance par catégorie de produit', status: 'draft' },
    ],
    dashboards: [
      {
        name: 'Tableau de Bord E-commerce',
        description: 'Vue d\'ensemble de la boutique en ligne',
        widgets: [
          { widgetType: 'kpi_card', title: 'Commandes du jour', subtitle: 'Total commandes', category: 'Commandes', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'CA journalier', subtitle: 'Chiffre d\'affaires', category: 'Chiffre d\'affaires', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Taux de conversion', subtitle: '% visiteurs convertis', category: 'Taux de conversion', metric: 'percent', aggregation: 'avg' },
          { widgetType: 'kpi_card', title: 'Valeur moyenne', subtitle: 'Panier moyen', category: 'Valeur moyenne commande', metric: 'avg', aggregation: 'avg' },
          { widgetType: 'line_chart', title: 'Évolution CA', subtitle: '30 jours', category: 'Chiffre d\'affaires', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'bar_chart', title: 'Commandes par jour', subtitle: 'Volume', category: 'Commandes', metric: 'count', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Taux de conversion', subtitle: 'Tendance 30j', category: 'Taux de conversion', metric: 'percent', aggregation: 'avg' },
          { widgetType: 'pie_chart', title: 'Répartition CA', subtitle: 'Par jour', category: 'Chiffre d\'affaires', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'data_table', title: 'Détail quotidien', subtitle: 'Toutes métriques', category: 'Commandes', metric: 'count', aggregation: 'sum' },
          { widgetType: 'line_chart', title: 'Panier moyen', subtitle: 'Évolution 30j', category: 'Valeur moyenne commande', metric: 'avg', aggregation: 'avg' },
        ],
      },
      {
        name: 'Performance Produits',
        description: 'Analyse des performances commerciales',
        widgets: [
          { widgetType: 'bar_chart', title: 'CA par jour de semaine', subtitle: 'Comparaison', category: 'Chiffre d\'affaires', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'line_chart', title: 'Tendance commandes', subtitle: '90 jours', category: 'Commandes', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'CA hebdomadaire', subtitle: 'Total semaine', category: 'Chiffre d\'affaires', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Conversion tendance', subtitle: '90 jours', category: 'Taux de conversion', metric: 'percent', aggregation: 'avg' },
          { widgetType: 'kpi_card', title: 'Meilleur jour', subtitle: 'Commandes max', category: 'Commandes', metric: 'count', aggregation: 'max' },
          { widgetType: 'pie_chart', title: 'Répartition jours', subtitle: 'Volume commandes', category: 'Commandes', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Objectif mensuel', subtitle: 'Progression', category: 'Chiffre d\'affaires', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'data_table', title: 'Résumé hebdomadaire', subtitle: 'Stats par semaine', category: 'Commandes', metric: 'count', aggregation: 'sum' },
        ],
      },
    ],
    report: { name: 'Rapport E-commerce - TechShop Online', description: 'Rapport hebdomadaire des performances e-commerce' },
    generator: ecommerceGenerator,
  },
  {
    name: 'Auto Service Plus',
    slug: 'auto-service-plus',
    industry: 'other',
    status: 'active',
    contactName: 'Marc Lefèvre',
    contactEmail: 'contact@auto-service-plus.com',
    contactPhone: '+33 5 56 44 33 22',
    userEmail: 'contact@auto-service-plus.com',
    userName: 'Marc Lefèvre',
    dataSources: [
      { name: 'Logiciel Atelier', connectorType: 'postgresql', description: 'Base de données atelier automobile' },
      { name: 'Facturation', connectorType: 'quickbooks', description: 'Factures et paiements' },
      { name: 'Stock Pièces', connectorType: 'csv_upload', description: 'Inventaire pièces détachées' },
    ],
    pipelines: [
      { name: 'Pipeline Atelier', description: 'Suivi des réparations et activité atelier', status: 'active' },
      { name: 'Analyse Pièces (brouillon)', description: 'Analyse des ventes de pièces détachées', status: 'paused' },
    ],
    dashboards: [
      {
        name: 'Tableau de Bord Atelier',
        description: 'Suivi de l\'activité du garage automobile',
        widgets: [
          { widgetType: 'kpi_card', title: 'Réparations du jour', subtitle: 'Total réparations', category: 'Réparations', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Pièces vendues', subtitle: 'Quantité', category: 'Pièces vendues', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Heures de travail', subtitle: 'Heures mécaniciens', category: 'Heures de travail', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'line_chart', title: 'Réparations sur 30 jours', subtitle: 'Tendance', category: 'Réparations', metric: 'count', aggregation: 'sum' },
          { widgetType: 'bar_chart', title: 'Pièces par jour', subtitle: 'Volume', category: 'Pièces vendues', metric: 'count', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Heures travail tendance', subtitle: '30 jours', category: 'Heures de travail', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'data_table', title: 'Détail quotidien', subtitle: 'Toutes métriques', category: 'Réparations', metric: 'count', aggregation: 'sum' },
        ],
      },
      {
        name: 'Performance Hebdomadaire',
        description: 'Analyse hebdomadaire de l\'atelier',
        widgets: [
          { widgetType: 'bar_chart', title: 'Réparations par jour', subtitle: 'Semaine type', category: 'Réparations', metric: 'count', aggregation: 'sum' },
          { widgetType: 'line_chart', title: 'Tendance 90 jours', subtitle: 'Réparations', category: 'Réparations', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Total semaine', subtitle: 'Réparations cumulées', category: 'Réparations', metric: 'count', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Heures cumulées', subtitle: 'Tendance', category: 'Heures de travail', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'pie_chart', title: 'Répartition activité', subtitle: 'Par type', category: 'Réparations', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Moyenne journalière', subtitle: 'Réparations/jour', category: 'Réparations', metric: 'count', aggregation: 'avg' },
        ],
      },
    ],
    report: { name: 'Rapport Atelier - Auto Service Plus', description: 'Bilan d\'activité hebdomadaire du garage' },
    generator: automotiveGenerator,
  },
  {
    name: 'TransExpress',
    slug: 'trans-express',
    industry: 'logistics',
    status: 'trial',
    contactName: 'Amina Khelifi',
    contactEmail: 'contact@trans-express.com',
    contactPhone: '+33 3 88 55 66 77',
    userEmail: 'contact@trans-express.com',
    userName: 'Amina Khelifi',
    dataSources: [
      { name: 'Système de suivi', connectorType: 'rest_api', description: 'API tracking colis' },
      { name: 'Base de données livraisons', connectorType: 'postgresql', description: 'Base PostgreSQL livraisons' },
      { name: 'Rapports Excel', connectorType: 'excel_upload', description: 'Rapports quotidiens en Excel' },
    ],
    pipelines: [
      { name: 'Pipeline Livraisons', description: 'Suivi des colis et performances de livraison', status: 'active' },
      { name: 'Analyse Délais (brouillon)', description: 'Analyse des temps de transit et retards', status: 'draft' },
    ],
    dashboards: [
      {
        name: 'Suivi Livraisons',
        description: 'Tableau de bord logistique en temps réel',
        widgets: [
          { widgetType: 'kpi_card', title: 'Colis expédiés', subtitle: 'Total du jour', category: 'Colis expédiés', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Livraisons', subtitle: 'Livrées avec succès', category: 'Livraisons', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Temps de transit', subtitle: 'Moyen en heures', category: 'Temps de transit moyen', metric: 'hours', aggregation: 'avg' },
          { widgetType: 'line_chart', title: 'Volume colis 30 jours', subtitle: 'Tendance', category: 'Colis expédiés', metric: 'count', aggregation: 'sum' },
          { widgetType: 'bar_chart', title: 'Livraisons par jour', subtitle: 'Volume', category: 'Livraisons', metric: 'count', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Temps de transit', subtitle: 'Tendance 30j', category: 'Temps de transit moyen', metric: 'hours', aggregation: 'avg' },
          { widgetType: 'pie_chart', title: 'Répartition volume', subtitle: 'Par jour', category: 'Colis expédiés', metric: 'count', aggregation: 'sum' },
          { widgetType: 'data_table', title: 'Détail quotidien', subtitle: 'Toutes métriques', category: 'Colis expédiés', metric: 'count', aggregation: 'sum' },
        ],
      },
      {
        name: 'Performance Logistique',
        description: 'Analyse des performances de livraison',
        widgets: [
          { widgetType: 'line_chart', title: 'Tendance 90 jours', subtitle: 'Colis expédiés', category: 'Colis expédiés', metric: 'count', aggregation: 'sum' },
          { widgetType: 'bar_chart', title: 'Livraisons hebdomadaires', subtitle: 'Par jour', category: 'Livraisons', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Taux de livraison', subtitle: '% livrés / expédiés', category: 'Livraisons', metric: 'count', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Transit cumulé', subtitle: 'Tendance', category: 'Temps de transit moyen', metric: 'hours', aggregation: 'avg' },
          { widgetType: 'pie_chart', title: 'Répartition jours', subtitle: 'Volume', category: 'Livraisons', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Moyenne hebdo', subtitle: 'Colis/jour', category: 'Colis expédiés', metric: 'count', aggregation: 'avg' },
          { widgetType: 'kpi_card', title: 'Pic journalier', subtitle: 'Max colis', category: 'Colis expédiés', metric: 'count', aggregation: 'max' },
        ],
      },
    ],
    report: { name: 'Rapport Logistique - TransExpress', description: 'Rapport hebdomadaire des opérations de livraison' },
    generator: logisticsGenerator,
  },
  {
    name: 'Cabinet Durand',
    slug: 'cabinet-durand',
    industry: 'services',
    status: 'active',
    contactName: 'Claire Durand',
    contactEmail: 'contact@cabinet-durand.com',
    contactPhone: '+33 1 53 22 44 66',
    userEmail: 'contact@cabinet-durand.com',
    userName: 'Claire Durand',
    dataSources: [
      { name: 'Gestion Cabinet', connectorType: 'postgresql', description: 'Base de données du cabinet de conseil' },
      { name: 'Comptabilité', connectorType: 'quickbooks', description: 'Facturation et comptabilité' },
      { name: 'Timesheets', connectorType: 'google_sheets', description: 'Feuilles de temps consultants' },
      { name: 'CRM Clients', connectorType: 'rest_api', description: 'Données clients et projets' },
    ],
    pipelines: [
      { name: 'Pipeline Cabinet', description: 'Suivi des heures facturées, projets et revenus', status: 'active' },
      { name: 'Analyse Rentabilité (brouillon)', description: 'Analyse de rentabilité par projet et consultant', status: 'paused' },
    ],
    dashboards: [
      {
        name: 'Tableau de Bord Cabinet',
        description: 'Vue d\'ensemble de l\'activité du cabinet de conseil',
        widgets: [
          { widgetType: 'kpi_card', title: 'Heures facturées', subtitle: 'Total du jour', category: 'Heures facturées', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Projets actifs', subtitle: 'En cours', category: 'Projets actifs', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Factures émises', subtitle: 'Nombre', category: 'Factures émises', metric: 'count', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'CA facturé', subtitle: 'Montant total', category: 'CA facturé', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'line_chart', title: 'Heures facturées 30j', subtitle: 'Tendance', category: 'Heures facturées', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'bar_chart', title: 'CA par jour', subtitle: 'Volume', category: 'CA facturé', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Projets tendance', subtitle: '30 jours', category: 'Projets actifs', metric: 'count', aggregation: 'sum' },
          { widgetType: 'pie_chart', title: 'Répartition CA', subtitle: 'Par jour', category: 'CA facturé', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'data_table', title: 'Détail quotidien', subtitle: 'Toutes métriques', category: 'Heures facturées', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'line_chart', title: 'Factures tendance', subtitle: '30 jours', category: 'Factures émises', metric: 'count', aggregation: 'sum' },
        ],
      },
      {
        name: 'Performance Hebdomadaire',
        description: 'Analyse de la performance hebdomadaire',
        widgets: [
          { widgetType: 'bar_chart', title: 'Heures par jour', subtitle: 'Semaine type', category: 'Heures facturées', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'line_chart', title: 'CA tendance 90j', subtitle: 'Long terme', category: 'CA facturé', metric: 'montant', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Total semaine', subtitle: 'Heures cumulées', category: 'Heures facturées', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'area_chart', title: 'Projets en cours', subtitle: 'Tendance', category: 'Projets actifs', metric: 'count', aggregation: 'sum' },
          { widgetType: 'pie_chart', title: 'Répartition activité', subtitle: 'Par type', category: 'Heures facturées', metric: 'hours', aggregation: 'sum' },
          { widgetType: 'kpi_card', title: 'Objectif hebdo', subtitle: 'Progression heures', category: 'Heures facturées', metric: 'hours', aggregation: 'sum' },
        ],
      },
    ],
    report: { name: 'Rapport Hebdomadaire - Cabinet Durand', description: 'Bilan d\'activité du cabinet de conseil' },
    generator: servicesGenerator,
  },
]

interface AgencyDefinition {
  name: string
  slug: string
  plan: string
  brandPrimaryColor: string
  brandSecondaryColor: string
  brandAccentColor: string
  adminEmail: string
  adminName: string
  smeIndices: number[] // indices into smeDefinitions
}

const agencyDefinitions: AgencyDefinition[] = [
  {
    name: 'DataViz Pro',
    slug: 'dataviz-pro',
    plan: 'enterprise',
    brandPrimaryColor: '#0F766E',
    brandSecondaryColor: '#134E4A',
    brandAccentColor: '#F59E0B',
    adminEmail: 'dataviz@dataviz-pro.com',
    adminName: 'Admin DataViz Pro',
    smeIndices: [0, 1, 2, 3],
  },
  {
    name: 'InsightHub',
    slug: 'insighthub',
    plan: 'pro',
    brandPrimaryColor: '#EA580C',
    brandSecondaryColor: '#7C2D12',
    brandAccentColor: '#0EA5E9',
    adminEmail: 'admin@insighthub.com',
    adminName: 'Admin InsightHub',
    smeIndices: [4, 5, 6, 7],
  },
]

export async function seedDatabase() {
  console.log('Starting seed...')

  // Clean existing data (order matters due to relations)
  console.log('Cleaning existing data...')
  await db.widget.deleteMany()
  await db.processedData.deleteMany()
  await db.pipelineRun.deleteMany()
  await db.pipeline.deleteMany()
  await db.report.deleteMany()
  await db.dashboard.deleteMany()
  await db.dataSource.deleteMany()
  await db.user.deleteMany()
  await db.smeClient.deleteMany()
  await db.agency.deleteMany()
  await db.auditLog.deleteMany()
  console.log('Database cleaned')

  // Super Admin
  console.log('Creating super admin...')
  const superAdmin = await db.user.create({
    data: {
      email: 'admin@databridge.io',
      name: 'Super Admin',
      hashedPassword: await hash('admin123', 12),
      role: 'super_admin',
      active: true,
    },
  })
  console.log(`   ${superAdmin.email}`)

  // Agencies
  for (const agencyDef of agencyDefinitions) {
    console.log(`Creating agency: ${agencyDef.name}...`)
    const agency = await db.agency.create({
      data: {
        name: agencyDef.name,
        slug: agencyDef.slug,
        plan: agencyDef.plan,
        brandPrimaryColor: agencyDef.brandPrimaryColor,
        brandSecondaryColor: agencyDef.brandSecondaryColor,
        brandAccentColor: agencyDef.brandAccentColor,
        status: 'active',
        maxSmeClients: agencyDef.plan === 'enterprise' ? 50 : 20,
        maxPipelinesPerClient: agencyDef.plan === 'enterprise' ? 10 : 5,
        maxDataSourcesPerClient: agencyDef.plan === 'enterprise' ? 20 : 10,
        maxRowsPerPipeline: agencyDef.plan === 'enterprise' ? 1000000 : 500000,
        maxStorageGb: agencyDef.plan === 'enterprise' ? 50.0 : 10.0,
      },
    })
    console.log(`   Agency created: ${agency.name}`)

    // Agency Admin
    console.log(`Creating agency admin for ${agencyDef.name}...`)
    const agencyAdmin = await db.user.create({
      data: {
        email: agencyDef.adminEmail,
        name: agencyDef.adminName,
        hashedPassword: await hash('agency123', 12),
        role: 'agency_admin',
        agencyId: agency.id,
        active: true,
      },
    })
    console.log(`   ${agencyAdmin.email}`)

    // SME Clients
    for (const smeIdx of agencyDef.smeIndices) {
      const smeDef = smeDefinitions[smeIdx]
      console.log(`Creating SME: ${smeDef.name}...`)

      const sme = await db.smeClient.create({
        data: {
          agencyId: agency.id,
          name: smeDef.name,
          slug: smeDef.slug,
          industry: smeDef.industry,
          contactName: smeDef.contactName,
          contactEmail: smeDef.contactEmail,
          contactPhone: smeDef.contactPhone,
          status: smeDef.status,
          onboardingCompleted: smeDef.status === 'active',
          storageUsedBytes: Math.floor(Math.random() * 5_000_000) + 500_000,
          lastActiveAt: new Date(),
        },
      })
      console.log(`   SME created: ${sme.name}`)

      // SME Admin User
      const smeAdmin = await db.user.create({
        data: {
          email: smeDef.userEmail,
          name: smeDef.userName,
          hashedPassword: await hash('password123', 12),
          role: 'sme_admin',
          orgId: sme.id,
          agencyId: agency.id,
          active: true,
        },
      })
      console.log(`   User: ${smeAdmin.email}`)

      // Data Sources
      const createdDataSources: DataSource[] = []
      for (const dsDef of smeDef.dataSources) {
        const ds = await db.dataSource.create({
          data: {
            orgId: sme.id,
            agencyId: agency.id,
            name: dsDef.name,
            description: dsDef.description,
            connectorType: dsDef.connectorType,
            status: 'connected',
            lastSyncAt: new Date(),
            lastSyncRows: Math.floor(Math.random() * 5000) + 500,
            syncFrequency: 'daily',
            fileSizeBytes: dsDef.connectorType.includes('upload')
              ? Math.floor(Math.random() * 2_000_000) + 100_000
              : null,
            fileName: dsDef.connectorType.includes('upload')
              ? `${dsDef.name.toLowerCase().replace(/\s+/g, '_')}.${dsDef.connectorType.includes('csv') ? 'csv' : 'xlsx'}`
              : null,
            detectedSchema: json([
              { column: 'date', type: 'date' },
              { column: 'montant', type: 'number' },
              { column: 'quantite', type: 'integer' },
              { column: 'categorie', type: 'string' },
            ]),
          },
        })
        createdDataSources.push(ds)
      }
      console.log(`   ${createdDataSources.length} data sources created`)

      // Pipelines
      const createdPipelines: Pipeline[] = []
      for (let pi = 0; pi < smeDef.pipelines.length; pi++) {
        const pDef = smeDef.pipelines[pi]
        const isActive = pDef.status === 'active'
        const pipeline = await db.pipeline.create({
          data: {
            orgId: sme.id,
            agencyId: agency.id,
            name: pDef.name,
            description: pDef.description,
            sourceIds: json(createdDataSources.slice(0, 2).map((d) => d.id)),
            status: pDef.status,
            transformationSteps: json([
              { id: 'step-1', type: 'filter', name: 'Filtrer données', icon: 'Filter', enabled: true, config: { column: 'date', operator: 'notNull' }, category: 'cleaning' },
              { id: 'step-2', type: 'aggregate', name: 'Agréger par jour', icon: 'BarChart3', enabled: true, config: { groupBy: 'date', measures: [{ column: 'montant', function: 'sum' }] }, category: 'aggregate' },
              { id: 'step-3', type: 'sort', name: 'Trier par date', icon: 'ArrowUpDown', enabled: true, config: { column: 'date', order: 'asc' }, category: 'transform' },
            ]),
            scheduleType: isActive ? 'daily' : 'manual',
            scheduleCron: isActive ? '0 6 * * *' : null,
            outputRowCount: isActive ? 90 * 3 : 0,
            totalRuns: isActive ? 45 : 0,
            failedRuns: isActive ? 2 : 0,
            totalRowsProcessed: isActive ? 45 * 300 : 0,
            lastRunAt: isActive ? new Date() : null,
            lastRunDurationMs: isActive ? Math.floor(Math.random() * 5000) + 2000 : null,
            lastRunStatus: isActive ? 'success' : null,
          },
        })
        createdPipelines.push(pipeline)
      }
      console.log(`   ${createdPipelines.length} pipelines created`)

      // Processed Data
      const activePipeline = createdPipelines.find((p) => p.status === 'active')
      let processedDataCount = 0
      if (activePipeline) {
        const dates = pastDates(90)
        const rng = seededRandom(sme.slug)
        const dataBatch: Array<{
          orgId: string
          pipelineId: string
          rowDate: string
          rowCategory: string
          rowMetric: string
          rowValue: number
          rowLabel: string
        }> = []

        for (const dateStr of dates) {
          const dataPoints = smeDef.generator(dateStr, rng)
          for (const dp of dataPoints) {
            // Skip zero-value entries for weekday-only industries on weekends
            if (dp.rowValue === 0) continue
            dataBatch.push({
              orgId: sme.id,
              pipelineId: activePipeline.id,
              rowDate: dateStr,
              rowCategory: dp.rowCategory,
              rowMetric: dp.rowMetric,
              rowValue: dp.rowValue,
              rowLabel: monthLabel(dateStr),
            })
          }
        }

        // Insert in batches of 500 for performance
        const BATCH_SIZE = 500
        for (let i = 0; i < dataBatch.length; i += BATCH_SIZE) {
          const batch = dataBatch.slice(i, i + BATCH_SIZE)
          await db.processedData.createMany({ data: batch })
        }
        processedDataCount = dataBatch.length
      }
      console.log(`   ${processedDataCount} processed data rows created`)

      // Dashboards & Widgets
      const widgetPositions = [
        { x: 0, y: 0, w: 3, h: 2 },
        { x: 3, y: 0, w: 3, h: 2 },
        { x: 6, y: 0, w: 3, h: 2 },
        { x: 9, y: 0, w: 3, h: 2 },
        { x: 0, y: 2, w: 6, h: 4 },
        { x: 6, y: 2, w: 6, h: 4 },
        { x: 0, y: 6, w: 6, h: 4 },
        { x: 6, y: 6, w: 6, h: 4 },
        { x: 0, y: 10, w: 12, h: 4 },
        { x: 0, y: 14, w: 6, h: 4 },
        { x: 6, y: 14, w: 6, h: 4 },
        { x: 0, y: 18, w: 12, h: 4 },
      ]

      let totalWidgets = 0
      for (const dashDef of smeDef.dashboards) {
        const dashboard = await db.dashboard.create({
          data: {
            orgId: sme.id,
            agencyId: agency.id,
            name: dashDef.name,
            description: dashDef.description,
            slug: dashDef.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            layout: json({ columns: 12, rowHeight: 40 }),
            filtersConfig: json([
              { id: 'f-date', column: 'rowDate', type: 'dateRange', label: 'Période' },
              { id: 'f-cat', column: 'rowCategory', type: 'select', label: 'Catégorie' },
            ]),
            autoRefreshSeconds: 300,
          },
        })

        // Create widgets for this dashboard
        for (let wi = 0; wi < dashDef.widgets.length; wi++) {
          const wDef = dashDef.widgets[wi]
          const pos = widgetPositions[wi % widgetPositions.length]
          const pipelineId = activePipeline?.id ?? null

          const queryConfig = json({
            xField: 'rowDate',
            yField: 'rowValue',
            filters: [
              { column: 'rowCategory', operator: 'eq', value: wDef.category },
              { column: 'rowMetric', operator: 'eq', value: wDef.metric },
            ],
            aggregation: wDef.aggregation,
            orderBy: { column: 'rowDate', direction: 'asc' },
            limit: wDef.widgetType === 'kpi_card' ? 1 : wDef.widgetType === 'data_table' ? 30 : 90,
          })

          const visualConfig = json({
            color: agencyDef.brandPrimaryColor,
            secondaryColor: agencyDef.brandSecondaryColor,
            accentColor: agencyDef.brandAccentColor,
            showGrid: wDef.widgetType !== 'kpi_card' && wDef.widgetType !== 'pie_chart',
            showLegend: ['line_chart', 'bar_chart', 'area_chart', 'pie_chart'].includes(wDef.widgetType),
            showAxes: ['line_chart', 'bar_chart', 'area_chart'].includes(wDef.widgetType),
            fontSize: wDef.widgetType === 'kpi_card' ? '2xl' : 'sm',
            prefix: wDef.metric === 'montant' ? '€' : '',
            suffix: wDef.metric === 'percent' ? '%' : '',
            decimals: wDef.metric === 'count' || wDef.metric === 'hours' ? 0 : 2,
          })

          await db.widget.create({
            data: {
              dashboardId: dashboard.id,
              orgId: sme.id,
              pipelineId,
              widgetType: wDef.widgetType,
              title: wDef.title,
              subtitle: wDef.subtitle,
              queryConfig,
              visualConfig,
              positionX: pos.x,
              positionY: pos.y,
              width: pos.w,
              height: pos.h,
            },
          })
          totalWidgets++
        }
      }
      console.log(`   2 dashboards with ${totalWidgets} widgets created`)

      // Report
      await db.report.create({
        data: {
          orgId: sme.id,
          agencyId: agency.id,
          name: smeDef.report.name,
          description: smeDef.report.description,
          scheduleType: 'weekly',
          scheduleCron: '0 8 * * 1', // Every Monday at 8am
          recipients: json([smeDef.contactEmail, agencyDef.adminEmail]),
          status: 'active',
        },
      })
      console.log(`   Report created`)
    }
  }

  // Audit Logs
  console.log('Creating audit logs...')

  // Gather real IDs from database
  const agencies = await db.agency.findMany()
  const firstAgency = agencies[0]
  const secondAgency = agencies[1]
  const firstAgencyAdmin = firstAgency
    ? await db.user.findFirst({ where: { agencyId: firstAgency.id, role: 'agency_admin' } })
    : null
  const secondAgencyAdmin = secondAgency
    ? await db.user.findFirst({ where: { agencyId: secondAgency.id, role: 'agency_admin' } })
    : null
  const firstAgencyClients = firstAgency
    ? await db.smeClient.findMany({ where: { agencyId: firstAgency.id }, take: 4 })
    : []
  const secondAgencyClients = secondAgency
    ? await db.smeClient.findMany({ where: { agencyId: secondAgency.id }, take: 4 })
    : []
  const firstAgencyPipelines = firstAgency
    ? await db.pipeline.findMany({ where: { agencyId: firstAgency.id }, take: 4 })
    : []
  const secondAgencyPipelines = secondAgency
    ? await db.pipeline.findMany({ where: { agencyId: secondAgency.id }, take: 4 })
    : []
  const firstAgencyDashboards = firstAgency
    ? await db.dashboard.findMany({ where: { agencyId: firstAgency.id }, take: 3 })
    : []
  const firstAgencySources = firstAgency
    ? await db.dataSource.findMany({ where: { agencyId: firstAgency.id }, take: 3 })
    : []
  const secondAgencySources = secondAgency
    ? await db.dataSource.findMany({ where: { agencyId: secondAgency.id }, take: 3 })
    : []

  const auditEntries = [
    // Pipeline run events
    {
      userId: firstAgencyAdmin?.id,
      orgId: firstAgencyClients[0]?.id,
      agencyId: firstAgency?.id,
      action: 'pipeline_run',
      resource: 'pipeline',
      resourceId: firstAgencyPipelines[0]?.id,
      details: json({
        message: `Pipeline "${firstAgencyPipelines[0]?.name ?? 'Pipeline 1'}" exécuté avec succès`,
        status: 'success',
        durationMs: 4200,
        rowsProcessed: 365,
      }),
      createdAt: new Date('2025-06-13T10:30:00Z'),
    },
    {
      userId: firstAgencyAdmin?.id,
      orgId: firstAgencyClients[1]?.id,
      agencyId: firstAgency?.id,
      action: 'pipeline_run',
      resource: 'pipeline',
      resourceId: firstAgencyPipelines[1]?.id,
      details: json({
        message: `Pipeline "${firstAgencyPipelines[1]?.name ?? 'Pipeline 2'}" exécuté avec succès`,
        status: 'success',
        durationMs: 8900,
        rowsProcessed: 4500,
      }),
      createdAt: new Date('2025-06-13T09:00:00Z'),
    },
    {
      userId: firstAgencyAdmin?.id,
      orgId: firstAgencyClients[1]?.id,
      agencyId: firstAgency?.id,
      action: 'pipeline_run',
      resource: 'pipeline',
      resourceId: firstAgencyPipelines[2]?.id,
      details: json({
        message: `Pipeline "${firstAgencyPipelines[2]?.name ?? 'Pipeline 3'}" échoué - erreur de connexion source`,
        status: 'error',
        error: 'Connection refused: data source unreachable',
      }),
      createdAt: new Date('2025-06-13T09:15:00Z'),
    },
    {
      userId: secondAgencyAdmin?.id,
      orgId: secondAgencyClients[0]?.id,
      agencyId: secondAgency?.id,
      action: 'pipeline_run',
      resource: 'pipeline',
      resourceId: secondAgencyPipelines[0]?.id,
      details: json({
        message: `Pipeline "${secondAgencyPipelines[0]?.name ?? 'Pipeline A'}" exécuté avec succès`,
        status: 'success',
        durationMs: 6500,
        rowsProcessed: 8200,
      }),
      createdAt: new Date('2025-06-13T08:00:00Z'),
    },
    {
      userId: secondAgencyAdmin?.id,
      orgId: secondAgencyClients[1]?.id,
      agencyId: secondAgency?.id,
      action: 'pipeline_run',
      resource: 'pipeline',
      resourceId: secondAgencyPipelines[1]?.id,
      details: json({
        message: `Pipeline "${secondAgencyPipelines[1]?.name ?? 'Pipeline B'}" exécuté avec succès`,
        status: 'success',
        durationMs: 3200,
        rowsProcessed: 1200,
      }),
      createdAt: new Date('2025-06-12T18:00:00Z'),
    },

    // Client added events
    {
      userId: firstAgencyAdmin?.id,
      orgId: firstAgencyClients[3]?.id,
      agencyId: firstAgency?.id,
      action: 'client_added',
      resource: 'sme_client',
      resourceId: firstAgencyClients[3]?.id,
      details: json({
        message: `Nouveau client "${firstAgencyClients[3]?.name ?? 'Client'}" ajouté (essai)`,
        status: 'info',
      }),
      createdAt: new Date('2025-06-10T13:00:00Z'),
    },
    {
      userId: secondAgencyAdmin?.id,
      orgId: secondAgencyClients[2]?.id,
      agencyId: secondAgency?.id,
      action: 'client_added',
      resource: 'sme_client',
      resourceId: secondAgencyClients[2]?.id,
      details: json({
        message: `Nouveau client "${secondAgencyClients[2]?.name ?? 'Client'}" ajouté (essai)`,
        status: 'info',
      }),
      createdAt: new Date('2025-06-08T11:30:00Z'),
    },

    // Data source connected events
    {
      userId: firstAgencyAdmin?.id,
      orgId: firstAgencyClients[0]?.id,
      agencyId: firstAgency?.id,
      action: 'data_source_connected',
      resource: 'data_source',
      resourceId: firstAgencySources[0]?.id,
      details: json({
        message: `Source de données "${firstAgencySources[0]?.name ?? 'Source'}" connectée`,
        status: 'info',
      }),
      createdAt: new Date('2025-06-13T08:45:00Z'),
    },
    {
      userId: secondAgencyAdmin?.id,
      orgId: secondAgencyClients[0]?.id,
      agencyId: secondAgency?.id,
      action: 'data_source_connected',
      resource: 'data_source',
      resourceId: secondAgencySources[0]?.id,
      details: json({
        message: `Source de données "${secondAgencySources[0]?.name ?? 'Source'}" connectée`,
        status: 'info',
      }),
      createdAt: new Date('2025-06-12T14:00:00Z'),
    },
    {
      userId: secondAgencyAdmin?.id,
      orgId: secondAgencyClients[1]?.id,
      agencyId: secondAgency?.id,
      action: 'data_source_connected',
      resource: 'data_source',
      resourceId: secondAgencySources[1]?.id,
      details: json({
        message: `Erreur de synchronisation de "${secondAgencySources[1]?.name ?? 'Source'}"`,
        status: 'error',
        error: 'Sync failed: invalid API key',
      }),
      createdAt: new Date('2025-06-11T15:00:00Z'),
    },

    // Dashboard created events
    {
      userId: firstAgencyAdmin?.id,
      orgId: firstAgencyClients[2]?.id,
      agencyId: firstAgency?.id,
      action: 'dashboard_created',
      resource: 'dashboard',
      resourceId: firstAgencyDashboards[0]?.id,
      details: json({
        message: `Nouveau dashboard "${firstAgencyDashboards[0]?.name ?? 'Dashboard'}" créé`,
        status: 'info',
      }),
      createdAt: new Date('2025-06-13T07:30:00Z'),
    },
    {
      userId: secondAgencyAdmin?.id,
      orgId: secondAgencyClients[2]?.id,
      agencyId: secondAgency?.id,
      action: 'dashboard_created',
      resource: 'dashboard',
      resourceId: firstAgencyDashboards[1]?.id,
      details: json({
        message: `Nouveau dashboard "${firstAgencyDashboards[1]?.name ?? 'Dashboard'}" créé`,
        status: 'info',
      }),
      createdAt: new Date('2025-06-11T10:00:00Z'),
    },

    // Template deployed events
    {
      userId: firstAgencyAdmin?.id,
      orgId: firstAgencyClients[0]?.id,
      agencyId: firstAgency?.id,
      action: 'template_deployed',
      resource: 'dashboard',
      resourceId: firstAgencyDashboards[2]?.id,
      details: json({
        message: 'Template "Performance Hebdomadaire" déployé',
        status: 'info',
      }),
      createdAt: new Date('2025-06-12T16:00:00Z'),
    },
    {
      userId: secondAgencyAdmin?.id,
      orgId: secondAgencyClients[0]?.id,
      agencyId: secondAgency?.id,
      action: 'template_deployed',
      resource: 'dashboard',
      resourceId: firstAgencyDashboards[0]?.id,
      details: json({
        message: 'Template "Performance Produits" déployé',
        status: 'info',
      }),
      createdAt: new Date('2025-06-10T09:00:00Z'),
    },

    // Client suspended event
    {
      userId: firstAgencyAdmin?.id,
      orgId: firstAgencyClients[2]?.id,
      agencyId: firstAgency?.id,
      action: 'client_suspended',
      resource: 'sme_client',
      resourceId: firstAgencyClients[2]?.id,
      details: json({
        message: `Client "${firstAgencyClients[2]?.name ?? 'Client'}" suspendu - problème de paiement`,
        status: 'warning',
      }),
      createdAt: new Date('2025-05-30T12:00:00Z'),
    },

    // More pipeline run events
    {
      userId: firstAgencyAdmin?.id,
      orgId: firstAgencyClients[2]?.id,
      agencyId: firstAgency?.id,
      action: 'pipeline_run',
      resource: 'pipeline',
      resourceId: firstAgencyPipelines[3]?.id,
      details: json({
        message: `Pipeline "${firstAgencyPipelines[3]?.name ?? 'Pipeline 4'}" exécuté avec succès`,
        status: 'success',
        durationMs: 5600,
        rowsProcessed: 3400,
      }),
      createdAt: new Date('2025-06-13T07:00:00Z'),
    },
    {
      userId: secondAgencyAdmin?.id,
      orgId: secondAgencyClients[2]?.id,
      agencyId: secondAgency?.id,
      action: 'pipeline_run',
      resource: 'pipeline',
      resourceId: secondAgencyPipelines[2]?.id,
      details: json({
        message: `Pipeline "${secondAgencyPipelines[2]?.name ?? 'Pipeline C'}" exécuté avec succès`,
        status: 'success',
        durationMs: 12300,
        rowsProcessed: 6800,
      }),
      createdAt: new Date('2025-06-13T06:30:00Z'),
    },
    {
      userId: secondAgencyAdmin?.id,
      orgId: secondAgencyClients[3]?.id,
      agencyId: secondAgency?.id,
      action: 'data_source_connected',
      resource: 'data_source',
      resourceId: secondAgencySources[2]?.id,
      details: json({
        message: `Source de données "${secondAgencySources[2]?.name ?? 'Source'}" connectée`,
        status: 'info',
      }),
      createdAt: new Date('2025-06-13T05:00:00Z'),
    },
  ]

  for (const entry of auditEntries) {
    await db.auditLog.create({ data: entry })
  }
  console.log(`   ${auditEntries.length} audit logs created`)

  // Summary
  const counts = {
    agencies: await db.agency.count(),
    smeClients: await db.smeClient.count(),
    users: await db.user.count(),
    dataSources: await db.dataSource.count(),
    pipelines: await db.pipeline.count(),
    dashboards: await db.dashboard.count(),
    widgets: await db.widget.count(),
    reports: await db.report.count(),
    processedData: await db.processedData.count(),
    auditLogs: await db.auditLog.count(),
  }

  console.log('\nSeed completed successfully!')
  console.log(`Agencies:          ${counts.agencies}`)
  console.log(`SME Clients:       ${counts.smeClients}`)
  console.log(`Users:             ${counts.users}`)
  console.log(`Data Sources:      ${counts.dataSources}`)
  console.log(`Pipelines:         ${counts.pipelines}`)
  console.log(`Dashboards:        ${counts.dashboards}`)
  console.log(`Widgets:           ${counts.widgets}`)
  console.log(`Reports:           ${counts.reports}`)
  console.log(`Processed Data:    ${counts.processedData}`)
  console.log(`Audit Logs:        ${counts.auditLogs}`)
}

// Allow direct execution: ts-node src/lib/seed.ts
if (require.main === module) {
  seedDatabase()
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
    .finally(() => {
      void db.$disconnect()
    })
}
