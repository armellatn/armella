-- Migration: Échanges & Retours boutique
-- Run this in your PostgreSQL database

-- Table principale des échanges / retours
CREATE TABLE IF NOT EXISTS echanges (
    id                    SERIAL PRIMARY KEY,
    numero_echange        TEXT NOT NULL UNIQUE,
    client_id             INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    vente_originale_id    INTEGER REFERENCES ventes(id) ON DELETE SET NULL,
    date_echange          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type_operation        TEXT NOT NULL DEFAULT 'retour'
                              CHECK (type_operation IN ('retour', 'echange')),
    -- Valeur totale des produits retournés au magasin
    montant_retour        NUMERIC(10,2) NOT NULL DEFAULT 0,
    -- Valeur totale des produits donnés en remplacement (échange seulement)
    montant_remplacement  NUMERIC(10,2) NOT NULL DEFAULT 0,
    -- Impact net sur la caisse :
    --   > 0  → le magasin rembourse le client (réduit la recette)
    --   < 0  → le client paye un supplément (augmente la recette)
    montant_net           NUMERIC(10,2) GENERATED ALWAYS AS
                              (montant_retour - montant_remplacement) STORED,
    methode_paiement      TEXT DEFAULT 'espèces',
    notes                 TEXT,
    utilisateur_id        INTEGER,
    utilisateur_nom       TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lignes de détail : produits impliqués dans l'opération
CREATE TABLE IF NOT EXISTS details_echange (
    id              SERIAL PRIMARY KEY,
    echange_id      INTEGER NOT NULL REFERENCES echanges(id) ON DELETE CASCADE,
    produit_id      INTEGER NOT NULL REFERENCES produits(id),
    quantite        INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire   NUMERIC(10,2) NOT NULL,
    montant_total   NUMERIC(10,2) NOT NULL,
    -- 'retour'  → produit revient au stock
    -- 'sortie'  → produit quitte le stock (remplacement échange)
    sens            TEXT NOT NULL CHECK (sens IN ('retour', 'sortie')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_echanges_date          ON echanges (date_echange);
CREATE INDEX IF NOT EXISTS idx_echanges_client        ON echanges (client_id);
CREATE INDEX IF NOT EXISTS idx_echanges_vente_orig    ON echanges (vente_originale_id);
CREATE INDEX IF NOT EXISTS idx_details_echange_eid    ON details_echange (echange_id);
CREATE INDEX IF NOT EXISTS idx_details_echange_pid    ON details_echange (produit_id);
