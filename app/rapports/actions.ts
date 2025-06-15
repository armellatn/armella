"use server"

import db from "@/lib/db"

export async function getStockValueReport() {
  try {
    const result = await db.query(`
      SELECT 
        SUM(stock_quantite * prix_achat) as total_value,
        COUNT(*) as total_products,
        AVG(stock_quantite) as avg_stock
      FROM produits
    `)

    const row = result.rows[0]
    return {
      totalValue: Number.parseFloat(row.total_value) || 0,
      totalProducts: Number.parseInt(row.total_products) || 0,
      avgStock: Number.parseFloat(row.avg_stock) || 0,
    }
  } catch (error) {
    console.error("Error fetching stock value report:", error)
    return {
      totalValue: 0,
      totalProducts: 0,
      avgStock: 0,
    }
  }
}

export async function getProductsByCategoryReport() {
  try {
    const result = await db.query(`
      SELECT 
        c.nom as category,
        COUNT(p.id) as product_count,
        SUM(p.stock_quantite) as total_stock,
        SUM(p.stock_quantite * p.prix_achat) as stock_value
      FROM produits p
      JOIN categories c ON p.categorie_id = c.id
      GROUP BY c.nom
      ORDER BY stock_value DESC
    `)

    return result.rows.map((item) => ({
      category: item.category,
      productCount: Number.parseInt(item.product_count) || 0,
      totalStock: Number.parseInt(item.total_stock) || 0,
      stockValue: Number.parseFloat(item.stock_value) || 0,
    }))
  } catch (error) {
    console.error("Error fetching products by category report:", error)
    return []
  }
}
