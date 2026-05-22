-- Migration 003: add type_vente_origine to echanges
ALTER TABLE echanges
  ADD COLUMN IF NOT EXISTS type_vente_origine TEXT NOT NULL DEFAULT 'boutique'
  CHECK (type_vente_origine IN ('boutique', 'colissimo'));

CREATE INDEX IF NOT EXISTS idx_echanges_type_vente ON echanges (type_vente_origine);
