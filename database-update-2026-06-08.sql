ALTER TABLE ingresos
ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'Otros';

INSERT INTO categorias (id_categoria, nombre)
VALUES
    (1, 'Comida y snacks'),
    (2, 'Entretenimiento'),
    (3, 'Educación'),
    (4, 'Transporte'),
    (5, 'Ropa y accesorios'),
    (6, 'Tecnología y juegos'),
    (7, 'Salud y cuidado'),
    (8, 'Regalos y salidas')
ON CONFLICT (id_categoria) DO UPDATE SET nombre = EXCLUDED.nombre;

SELECT setval(
    pg_get_serial_sequence('categorias', 'id_categoria'),
    (SELECT MAX(id_categoria) FROM categorias)
);
