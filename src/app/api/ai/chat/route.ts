import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Predefined contextual responses based on keywords and data context
function generateContextualResponse(query: string, dataContext: {
  pipelineCount: number
  dashboardCount: number
  sourceCount: number
  sourceNames: string[]
  recentMetrics: string[]
}): string {
  const q = query.toLowerCase()

  const orgInfo = dataContext.sourceCount > 0
    ? `Vous avez actuellement **${dataContext.pipelineCount} pipelines**, **${dataContext.dashboardCount} dashboards** et **${dataContext.sourceCount} sources de données** (${dataContext.sourceNames.join(', ')}).`
    : 'Aucune source de données n\'est actuellement configurée pour votre organisation.'

  if (q.includes('metric') || q.includes('données') || q.includes('data') || q.includes('performance') || q.includes('statistique')) {
    const metrics = dataContext.recentMetrics.length > 0
      ? dataContext.recentMetrics.slice(0, 8).map(m => `- ${m}`).join('\n')
      : '- Aucune donnée récente disponible'
    return `Voici un aperçu de vos métriques récentes :\n\n${metrics}\n\nJe vous recommande de consulter le **Dashboard** pour une vue plus complète et interactive de vos données.`
  }

  if (q.includes('pipeline') || q.includes('etl') || q.includes('flux')) {
    return `**Pipelines**\n\n${orgInfo}\n\nPour optimiser vos pipelines, je vous suggère de :\n1. Vérifier la fréquence d'exécution de chaque pipeline\n2. Consulter les logs d'activité pour identifier les échecs\n3. Mettre à jour les transformations si nécessaire\n\nRendez-vous dans la section **Pipelines** pour gérer vos flux de données.`
  }

  if (q.includes('source') || q.includes('connector') || q.includes('connexion') || q.includes('ga4') || q.includes('google') || q.includes('meta')) {
    return `**Sources de données**\n\n${orgInfo}\n\nVous pouvez ajouter de nouvelles sources depuis la section **Data Sources**. Les connecteurs disponibles incluent : Google Analytics 4, Meta Ads, Google Ads, LinkedIn Ads, CSV Import et API personnalisée.`
  }

  if (q.includes('rapport') || q.includes('report') || q.includes('export') || q.includes('pdf') || q.includes('csv')) {
    return `**Rapports**\n\nVous pouvez générer des rapports depuis la section **Reports**. Les formats disponibles sont :\n- **PDF** — Rapports visuels pour les présentations client\n- **CSV** — Export brut pour analyse dans Excel\n- **XLSX** — Classeurs structurés\n- **JSON** — Données brutes pour intégration\n\nLes rapports peuvent être planifiés ou générés à la demande.`
  }

  if (q.includes('conversion') || q.includes('taux') || q.includes('vente') || q.includes('revenue')) {
    return `**Analyse de conversion**\n\n${orgInfo}\n\nPour une analyse détaillée de vos taux de conversion, consultez les graphiques dans votre **Dashboard**. Vous pouvez filtrer par période et par source pour identifier les canaux les plus performants.\n\n💡 **Conseil** : Segmentez vos données par campagne pour identifier les opportunités d'optimisation.`
  }

  if (q.includes('dashboard') || q.includes('tableau de bord') || q.includes('kpi') || q.includes('widget')) {
    return `**Dashboards**\n\n${orgInfo}\n\nVotre tableau de bord affiche les KPI principaux de votre activité. Vous pouvez personnaliser les widgets et créer des vues spécifiques selon vos besoins.\n\nNaviguez vers **Dashboard** pour voir vos données en temps réel.`
  }

  if (q.includes('aide') || q.includes('help') || q.includes('comment') || q.includes('comment faire') || q.includes('guide')) {
    return `**Guide DataBridge Analytics**\n\nVoici les sections disponibles :\n\n1. **Dashboard** — Vue d'ensemble de vos KPI et performances\n2. **Data Sources** — Gestion des connecteurs de données\n3. **Pipelines** — Configuration des flux ETL\n4. **Reports** — Génération et planification de rapports\n5. **Clients** — Gestion de vos clients et organisations\n6. **Templates** — Modèles de dashboards et rapports\n7. **Branding** — Personnalisation de l'interface\n\nComment puis-je vous aider davantage ?`
  }

  return `Merci pour votre question. ${orgInfo}\n\nPour une analyse approfondie, je vous recommande de :\n- Consulter le **Dashboard** pour les métriques en temps réel\n- Explorer les **Reports** pour des analyses détaillées\n- Vérifier vos **Pipelines** pour l'état des flux de données\n\nN'hésitez pas à poser une question plus spécifique !`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, orgId } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      )
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId is required' },
        { status: 400 }
      )
    }

    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
    const userQuery = lastUserMessage?.content ?? ''

    const pipelineCount = await db.pipeline.count({ where: { orgId } })
    const dashboardCount = await db.dashboard.count({ where: { orgId } })
    const sourceCount = await db.dataSource.count({ where: { orgId } })
    const dataSources = await db.dataSource.findMany({
      where: { orgId },
      select: { name: true, connectorType: true, status: true },
    })
    const recentData = await db.processedData.findMany({
      where: { orgId },
      orderBy: { rowDate: 'desc' },
      take: 20,
      distinct: ['rowDate', 'rowCategory', 'rowMetric'],
    })

    const dataContext = {
      pipelineCount,
      dashboardCount,
      sourceCount,
      sourceNames: dataSources.map(s => `${s.name} (${s.connectorType})`),
      recentMetrics: recentData.map(d => `${d.rowDate} | ${d.rowCategory} | ${d.rowMetric}: ${d.rowValue}`),
    }

    // Simulate a short processing delay
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700))

    const response = generateContextualResponse(userQuery, dataContext)

    return NextResponse.json({
      message: response,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    console.error('Chat request failed:', error)
    const message = error instanceof Error ? error.message : 'Chat request failed'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
