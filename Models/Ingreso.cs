using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FinanzasApi.Models
{
    [Table("ingresos")]
    public class Ingreso
    {
        [Key]
        [Column("id_ingreso")]
        public int IdIngreso { get; set; }

        [Column("id_usuario")]
        public int IdUsuario { get; set; }

        [Column("descripcion")]
        public string Descripcion { get; set; } = string.Empty;

        [Column("categoria")]
        public string Categoria { get; set; } = string.Empty;

        [Column("monto")]
        public decimal Monto { get; set; }

        [Column("fecha")]
        public DateTime Fecha { get; set; }
    }
}
