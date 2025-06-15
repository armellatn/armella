"use server"

import db from "./db"
import { formatRelativeDate } from "./utils"

export async function getDashboardStats() {
  try {
    const productsResult = await db.query(`SELECT COUNT(*) as count FROM produits`)
    const totalProducts = parseInt(productsResult.rows[0].count)

    const customersResult = await db.query(`SELECT COUNT(*) as count FROM clients`)
    const totalCustomers = parseInt(customersResult.rows[0].count)

    const salesResult = await db.query(`SELECT COUNT(*) as count FROM ventes`)
    const totalSales = parseInt(salesResult.rows[0].count)

    const lowStockResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM produits 
      WHERE stock_quantite <= stock_minimum
    `)
    const lowStockCount = parseInt(lowStockResult.rows[0].count)

    const recentSalesResult = await db.query(`
      SELECT COUNT(*) as count 
      FROM ventes 
      WHERE date_vente >= NOW() - INTERVAL '24 hours'
    `)
    const recentSalesCount = parseInt(recentSalesResult.rows[0].count)

    const currentMonthRevenueResult = await db.query(`
      SELECT COALESCE(SUM(montant_paye), 0) as revenue
      FROM ventes
      WHERE EXTRACT(MONTH FROM date_vente) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM date_vente) = EXTRACT(YEAR FROM CURRENT_DATE)
    `)
    const currentMonthRevenue = parseFloat(currentMonthRevenueResult.rows[0].revenue)

    const previousMonthRevenueResult = await db.query(`
      SELECT COALESCE(SUM(montant_paye), 0) as revenue
      FROM ventes
      WHERE EXTRACT(MONTH FROM date_vente) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
        AND EXTRACT(YEAR FROM date_vente) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
    `)
    const previousMonthRevenue = parseFloat(previousMonthRevenueResult.rows[0].revenue)

    let revenueChangePercentage = 0
    if (previousMonthRevenue > 0) {
      revenueChangePercentage =
        ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    }

    return {
      totalProducts,
      totalCustomers,
      totalSales,
      lowStockCount,
      recentSalesCount,
      currentMonthRevenue,
      revenueChangePercentage,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalProducts: 0,
      totalCustomers: 0,
      totalSales: 0,
      lowStockCount: 0,
      recentSalesCount: 0,
      currentMonthRevenue: 0,
      revenueChangePercentage: 0,
    }
  }
}

export async function getStockAlerts() {
  try {
    const result = await db.query(`
      SELECT id, nom as name, marque as brand, stock_quantite as stock, stock_minimum as min_stock
      FROM produits
      WHERE stock_quantite <= stock_minimum
      ORDER BY stock_quantite ASC
      LIMIT 5
    `)

    return result.rows
  } catch (error) {
    console.error("Error fetching stock alerts:", error)
    return []
  }
}

export async function getRecentSales() {
  try {
    const result = await db.query(`
      SELECT v.id, v.montant_paye as amount, v.date_vente as date, 
             c.nom || ' ' || c.prenom as "clientName"
      FROM ventes v
      LEFT JOIN clients c ON v.client_id = c.id
      ORDER BY v.date_vente DESC
      LIMIT 5
    `)

    return result.rows.map((sale) => ({
      ...sale,
      amount: parseFloat(sale.amount),
      date: formatRelativeDate(sale.date),
      clientName: sale.clientName || "Client occasionnel",
    }))
  } catch (error) {
    console.error("Error fetching recent sales:", error)
    return []
  }
}

export async function getMonthlySalesData() {
  try {
    const result = await db.query(`
      SELECT 
        EXTRACT(MONTH FROM date_vente) as month,
        EXTRACT(YEAR FROM date_vente) as year,
        SUM(montant_paye) as total
      FROM ventes
      WHERE date_vente >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY EXTRACT(MONTH FROM date_vente), EXTRACT(YEAR FROM date_vente)
      ORDER BY year, month
    `)

    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]

    return result.rows.map((item) => ({
      month: monthNames[parseInt(item.month) - 1],
      year: parseInt(item.year),
      total: parseFloat(item.total),
    }))
  } catch (error) {
    console.error("Error fetching monthly sales data:", error)
    return []
  }
}

export async function getTopSellingProducts() {
  try {
    const result = await db.query(`
      SELECT 
        p.nom as name,
        SUM(dv.quantite) as quantity
      FROM details_vente dv
      JOIN produits p ON dv.produit_id = p.id
      JOIN ventes v ON dv.vente_id = v.id
      WHERE v.date_vente >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY p.id, p.nom
      ORDER BY quantity DESC
      LIMIT 5
    `)

    return result.rows.map((item) => ({
      ...item,
      quantity: parseInt(item.quantity),
    }))
  } catch (error) {
    console.error("Error fetching top selling products:", error)
    return []
  }
}
export async function getStockStats() {
  const { rows } = await db.query(`
    SELECT 
      COUNT(*) AS total_produits,
      SUM(stock_quantite) AS total_quantite,
      SUM(stock_quantite * prix_achat) AS valeur_totale_stock
    FROM produits
  `)

  return {
    totalProduits: Number(rows[0].total_produits),
    totalQuantite: Number(rows[0].total_quantite),
    valeurTotaleStock: Number(rows[0].valeur_totale_stock),
  }
}
export async function getTopStockedProducts() {
  const { rows } = await db.query(`
    SELECT nom, stock_quantite
    FROM produits
    ORDER BY stock_quantite DESC
    LIMIT 5
  `)

  return rows.map((row: any) => ({
    name: row.nom,
    value: Number(row.stock_quantite),
  }))
}

