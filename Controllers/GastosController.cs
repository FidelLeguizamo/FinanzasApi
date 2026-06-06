using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanzasApi.Data;
using FinanzasApi.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace FinanzasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GastosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GastosController(AppDbContext context)
        {
            _context = context;
        }


        [HttpPost]
        public async Task<IActionResult> CrearGasto([FromBody] Gasto nuevoGasto)
        {
            if (nuevoGasto == null || nuevoGasto.Monto <= 0 || nuevoGasto.IdUsuario <= 0 || nuevoGasto.IdCategoria <= 0)
            {
                return BadRequest("Datos inválidos.");
            }

            try
            {
                if (nuevoGasto.Fecha == DateTime.MinValue) nuevoGasto.Fecha = DateTime.UtcNow;
                else nuevoGasto.Fecha = DateTime.SpecifyKind(nuevoGasto.Fecha, DateTimeKind.Utc);

                _context.Gastos.Add(nuevoGasto);
                await _context.SaveChangesAsync();
                return Ok(nuevoGasto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }


        [HttpGet("dashboard/{idUsuario}")]
        public async Task<IActionResult> ObtenerDashboard(int idUsuario)
        {
            try
            {
                var totalIngresos = await _context.Ingresos.Where(i => i.IdUsuario == idUsuario).SumAsync(i => (decimal?)i.Monto) ?? 0;
                var totalGastos = await _context.Gastos.Where(g => g.IdUsuario == idUsuario).SumAsync(g => (decimal?)g.Monto) ?? 0;
                var balance = totalIngresos - totalGastos;

                var resumenPorCategoria = await _context.Gastos
                    .Where(g => g.IdUsuario == idUsuario)
                    .GroupBy(g => g.IdCategoria)
                    .Select(grupo => new
                    {
                        CategoriaId = grupo.Key,
                        Total = grupo.Sum(g => g.Monto),
                        Promedio = grupo.Average(g => g.Monto),
                        Cantidad = grupo.Count()
                    })
                    .ToListAsync();

                var categorias = await _context.Categorias.ToListAsync();

                var gastosPorCategoria = resumenPorCategoria
                    .Select(resumen => new
                    {
                        categoriaId = resumen.CategoriaId,
                        categoria = categorias.FirstOrDefault(c => c.IdCategoria == resumen.CategoriaId)?.Nombre ?? $"Categoría {resumen.CategoriaId}",
                        total = resumen.Total,
                        promedio = resumen.Promedio,
                        cantidad = resumen.Cantidad
                    })
                    .OrderByDescending(categoria => categoria.promedio)
                    .ToList();

                return Ok(new
                {
                    datos = new
                    {
                        totalIngresos = totalIngresos,
                        totalGastos = totalGastos,
                        balance = balance,
                        categorias = gastosPorCategoria
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
    }
}
