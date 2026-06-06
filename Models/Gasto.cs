using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FinanzasApi.Models
{
    [Table("gastos")]
    public class Gasto
    {
        [Key]
        [Column("id_gasto")]
        public int IdGasto { get; set; }

        [Column("id_usuario")]
        public int IdUsuario { get; set; }

        [Column("id_categoria")]
        public int IdCategoria { get; set; }

        [Column("descripcion")]
        public string Descripcion { get; set; } = string.Empty;

        [Column("monto")]
        public decimal Monto { get; set; }

        [Column("fecha")]
        public DateTime Fecha { get; set; }
    }
}