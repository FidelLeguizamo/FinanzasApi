using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanzasApi.Data;
using FinanzasApi.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace FinanzasApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GastosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private static readonly Dictionary<int, string> CategoriasGasto = new()
        {
            { 1, "Comida y snacks" },
            { 2, "Entretenimiento" },
            { 3, "Educación" },
            { 4, "Transporte" },
            { 5, "Ropa y accesorios" },
            { 6, "Tecnología y juegos" },
            { 7, "Salud y cuidado" },
            { 8, "Regalos y salidas" }
        };

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
                if (nuevoGasto.Fecha == DateTime.MinValue)
                {
                    nuevoGasto.Fecha = DateTime.UtcNow;
                }
                else
                {
                    nuevoGasto.Fecha = DateTime.SpecifyKind(nuevoGasto.Fecha.Date.AddHours(12), DateTimeKind.Utc);
                }

                if (nuevoGasto.Fecha.Date > HoyArgentina())
                {
                    return BadRequest("No se pueden registrar gastos con fecha futura.");
                }

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

                var gastosPorCategoria = resumenPorCategoria
                    .Select(resumen => new
                    {
                        categoriaId = resumen.CategoriaId,
                        categoria = NombreCategoria(resumen.CategoriaId),
                        total = resumen.Total,
                        promedio = resumen.Promedio,
                        cantidad = resumen.Cantidad
                    })
                    .OrderByDescending(categoria => categoria.total)
                    .ToList();

                return Ok(new
                {
                    datos = new
                    {
                        totalIngresos,
                        totalGastos,
                        balance,
                        categorias = gastosPorCategoria
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        [HttpGet("historial/{idUsuario}")]
        public async Task<IActionResult> ObtenerHistorial(int idUsuario)
        {
            try
            {
                var ingresos = await _context.Ingresos
                    .Where(i => i.IdUsuario == idUsuario)
                    .Select(i => new
                    {
                        id = i.IdIngreso,
                        tipo = "Ingreso",
                        categoria = i.Categoria,
                        descripcion = i.Descripcion,
                        monto = i.Monto,
                        fecha = i.Fecha.Date
                    })
                    .ToListAsync();

                var gastosRaw = await _context.Gastos
                    .Where(g => g.IdUsuario == idUsuario)
                    .Select(g => new
                    {
                        g.IdGasto,
                        g.IdCategoria,
                        g.Descripcion,
                        g.Monto,
                        Fecha = g.Fecha.Date
                    })
                    .ToListAsync();

                var gastos = gastosRaw.Select(g => new
                {
                    id = g.IdGasto,
                    tipo = "Gasto",
                    categoria = NombreCategoria(g.IdCategoria),
                    descripcion = g.Descripcion,
                    monto = g.Monto,
                    fecha = g.Fecha
                });

                var historial = ingresos
                    .Concat(gastos)
                    .OrderByDescending(m => m.fecha)
                    .ThenByDescending(m => m.id)
                    .ToList();

                return Ok(new { datos = historial });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

        private static DateTime HoyArgentina()
        {
            return DateTime.UtcNow.AddHours(-3).Date;
        }

        private static string NombreCategoria(int idCategoria)
        {
            return CategoriasGasto.TryGetValue(idCategoria, out var nombre)
                ? nombre
                : $"Categoría {idCategoria}";
        }
    }
}
