using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FinanzasApi.Models
{
    [Table("objetivos")]
    public class Objetivo
    {
        [Key]
        [Column("id_objetivo")]
        public int IdObjetivo { get; set; }

        [Column("id_usuario")]
        public int IdUsuario { get; set; }

        [Column("descripcion")]
        public string Descripcion { get; set; } = string.Empty;

        [Column("monto_objetivo")]
        public decimal MontoObjetivo { get; set; }

        [Column("monto_actual")]
        public decimal MontoActual { get; set; }
    }
}