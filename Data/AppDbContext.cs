using Microsoft.EntityFrameworkCore;
using FinanzasApi.Models;

namespace FinanzasApi.Data
{
    public class AppDbContext : DbContext
    {
        
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        
        public DbSet<Usuario> Usuarios { get; set; }

       
        public DbSet<Ingreso> Ingresos { get; set; }

        
        public DbSet<Gasto> Gastos { get; set; }

        public DbSet<Categoria> Categorias { get; set; }
    }
}
