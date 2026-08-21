-- 1. Coordonnées + favoris sur les lieux d'un carnet
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS favorite boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_place_id text;

-- 2. Catalogue de lieux par ville
CREATE TABLE public.catalog_places (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city text NOT NULL,
  country text,
  name text NOT NULL,
  category text,
  area text,
  description text,
  lat double precision,
  lng double precision,
  google_place_id text,
  source text NOT NULL DEFAULT 'seed',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX catalog_places_city_idx ON public.catalog_places (lower(city));
CREATE UNIQUE INDEX catalog_places_city_name_key ON public.catalog_places (lower(city), lower(name));

GRANT SELECT ON public.catalog_places TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_places TO authenticated;
GRANT ALL ON public.catalog_places TO service_role;

ALTER TABLE public.catalog_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalog is readable by everyone"
  ON public.catalog_places FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Signed-in travellers can add catalog places"
  ON public.catalog_places FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Contributors update their catalog places"
  ON public.catalog_places FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Contributors delete their catalog places"
  ON public.catalog_places FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS catalog_place_id uuid REFERENCES public.catalog_places(id) ON DELETE SET NULL;

-- 3. Favoris privés
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  catalog_place_id uuid NOT NULL REFERENCES public.catalog_places(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, catalog_place_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own favorites"
  ON public.favorites FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Catalogue de départ
INSERT INTO public.catalog_places (city, country, name, category, area, description, lat, lng, source, created_by) VALUES
('Paris','France','Tour Eiffel','Vue','Champ-de-Mars','La dame de fer, vue panoramique sur la Seine.',48.8584,2.2945,'seed',NULL),
('Paris','France','Musée d''Orsay','Culture','7e','Impressionnistes dans une ancienne gare.',48.8600,2.3266,'seed',NULL),
('Paris','France','Marché des Enfants Rouges','Resto','Le Marais','Plus vieux marché couvert de Paris.',48.8629,2.3626,'seed',NULL),
('Paris','France','Buttes-Chaumont','Balade','19e','Parc vallonné avec temple perché.',48.8799,2.3822,'seed',NULL),
('Paris','France','Le Comptoir Général','Bar','Canal Saint-Martin','Bar-jungle dans un hangar.',48.8703,2.3663,'seed',NULL),
('Paris','France','Sainte-Chapelle','Culture','Île de la Cité','Vitraux gothiques du XIIIe siècle.',48.8554,2.3450,'seed',NULL),
('Paris','France','Canal Saint-Martin','Balade','10e','Passerelles, écluses et quais.',48.8717,2.3661,'seed',NULL),
('Lisbonne','Portugal','Miradouro da Senhora do Monte','Vue','Graça','Le plus haut belvédère de la ville.',38.7168,-9.1300,'seed',NULL),
('Lisbonne','Portugal','Time Out Market','Resto','Cais do Sodré','Halle gourmande de la ville.',38.7071,-9.1459,'seed',NULL),
('Lisbonne','Portugal','Mosteiro dos Jerónimos','Culture','Belém','Joyau manuélin classé UNESCO.',38.6979,-9.2065,'seed',NULL),
('Lisbonne','Portugal','LX Factory','Balade','Alcântara','Ancienne usine devenue quartier créatif.',38.7025,-9.1785,'seed',NULL),
('Lisbonne','Portugal','Pastéis de Belém','Resto','Belém','Les pastéis de nata originaux depuis 1837.',38.6975,-9.2035,'seed',NULL),
('Lisbonne','Portugal','Praia de Carcavelos','Plage','Carcavelos','Grande plage accessible en train.',38.6797,-9.3376,'seed',NULL),
('Lisbonne','Portugal','Park Bar','Bar','Bairro Alto','Rooftop sur un parking, vue Tage.',38.7112,-9.1470,'seed',NULL),
('Rome','Italie','Colisée','Culture','Centre historique','Amphithéâtre flavien, an 80.',41.8902,12.4922,'seed',NULL),
('Rome','Italie','Panthéon','Culture','Pigna','Dôme antique toujours debout.',41.8986,12.4769,'seed',NULL),
('Rome','Italie','Trastevere','Balade','Trastevere','Ruelles pavées et trattorias.',41.8890,12.4692,'seed',NULL),
('Rome','Italie','Giardino degli Aranci','Vue','Aventin','Jardin d''orangers avec vue sur les toits.',41.8846,12.4783,'seed',NULL),
('Rome','Italie','Roscioli','Resto','Regola','Épicerie-restaurant, cacio e pepe culte.',41.8945,12.4720,'seed',NULL),
('Rome','Italie','Villa Borghese','Balade','Pinciano','Grand parc et galerie Borghèse.',41.9142,12.4923,'seed',NULL),
('Rome','Italie','Freni e Frizioni','Bar','Trastevere','Apéritif dans un ancien garage.',41.8925,12.4685,'seed',NULL),
('Barcelone','Espagne','Sagrada Família','Culture','Eixample','Basilique inachevée de Gaudí.',41.4036,2.1744,'seed',NULL),
('Barcelone','Espagne','Parc Güell','Vue','Gràcia','Mosaïques et panorama sur la ville.',41.4145,2.1527,'seed',NULL),
('Barcelone','Espagne','Mercat de la Boqueria','Resto','El Raval','Marché emblématique des Ramblas.',41.3817,2.1717,'seed',NULL),
('Barcelone','Espagne','Barceloneta','Plage','Barceloneta','Plage urbaine et chiringuitos.',41.3784,2.1925,'seed',NULL),
('Barcelone','Espagne','Bunkers del Carmel','Vue','Horta-Guinardó','Coucher de soleil à 360°.',41.4194,2.1620,'seed',NULL),
('Barcelone','Espagne','Bar Marsella','Bar','El Raval','Bar à absinthe de 1820.',41.3789,2.1701,'seed',NULL),
('Barcelone','Espagne','Palau de la Música Catalana','Culture','Sant Pere','Modernisme catalan, salle de concert.',41.3875,2.1753,'seed',NULL),
('Marrakech','Maroc','Jardin Majorelle','Balade','Guéliz','Bleu Majorelle et bambous.',31.6423,-8.0031,'seed',NULL),
('Marrakech','Maroc','Place Jemaa el-Fna','Culture','Médina','Cœur vivant de la médina.',31.6258,-7.9891,'seed',NULL),
('Marrakech','Maroc','Palais Bahia','Culture','Médina','Zelliges, patios et plafonds peints.',31.6216,-7.9832,'seed',NULL),
('Marrakech','Maroc','Souk Semmarine','Balade','Médina','Le grand souk des artisans.',31.6295,-7.9877,'seed',NULL),
('Marrakech','Maroc','Le Jardin','Resto','Médina','Patio verdoyant pour déjeuner.',31.6304,-7.9887,'seed',NULL),
('Marrakech','Maroc','Terrasse des Épices','Vue','Médina','Rooftop face à l''Atlas.',31.6316,-7.9880,'seed',NULL),
('Marseille','France','Calanque de Sugiton','Plage','Luminy','Crique turquoise, accès à pied.',43.2116,5.4527,'seed',NULL),
('Marseille','France','Notre-Dame de la Garde','Vue','6e','La Bonne Mère, vue sur toute la ville.',43.2840,5.3712,'seed',NULL),
('Marseille','France','MuCEM','Culture','Vieux-Port','Musée des civilisations, dentelle de béton.',43.2965,5.3617,'seed',NULL),
('Marseille','France','Vallon des Auffes','Balade','7e','Petit port de pêcheurs caché.',43.2830,5.3524,'seed',NULL),
('Marseille','France','Cours Julien','Bar','6e','Street art, bars et terrasses.',43.2946,5.3830,'seed',NULL),
('Marseille','France','Chez Fonfon','Resto','Vallon des Auffes','Bouillabaisse face à la mer.',43.2830,5.3520,'seed',NULL);