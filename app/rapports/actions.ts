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

export async function getDetailedStock() {
  try {
    const result = await db.query(`
      SELECT 
        p.id,
        p.nom,
        p.marque,
        p.code_produit,
        p.stock_quantite,
        p.stock_minimum,
        p.prix_achat,
        p.prix_vente,
        p.duree_port,
        c.nom as categorie_nom
      FROM produits p
      LEFT JOIN categories c ON p.categorie_id = c.id
      ORDER BY p.nom ASC
    `)

    return result.rows.map((item) => ({
      id: item.id,
      nom: item.nom,
      marque: item.marque || "",
      codeBarre: item.code_produit || "",
      stockQuantite: Number.parseInt(item.stock_quantite) || 0,
      stockMinimum: Number.parseInt(item.stock_minimum) || 0,
      prixAchat: Number.parseFloat(item.prix_achat) || 0,
      prixVente: Number.parseFloat(item.prix_vente) || 0,
      categorie: item.categorie_nom || "Non catégorisé",
      dureePort: item.duree_port || "",
    }))
  } catch (error) {
    console.error("Error fetching detailed stock:", error)
    return []
  }
}

export async function getCategoriesForFilter() {
  try {
    const result = await db.query(`
      SELECT DISTINCT c.id, c.nom 
      FROM categories c
      INNER JOIN produits p ON p.categorie_id = c.id
      ORDER BY c.nom ASC
    `)

    return result.rows.map((item) => ({
      id: item.id,
      nom: item.nom,
    }))
  } catch (error) {
    console.error("Error fetching categories for filter:", error)
    return []
  }
}

export async function getBrandsForFilter() {
  try {
    const result = await db.query(`
      SELECT UPPER(marque) as marque_normalized, MIN(marque) as marque_display
      FROM produits 
      WHERE marque IS NOT NULL AND marque != ''
      GROUP BY UPPER(marque)
      ORDER BY marque_normalized ASC
    `)

    return result.rows.map((item) => item.marque_normalized)
  } catch (error) {
    console.error("Error fetching brands for filter:", error)
    return []
  }
}
