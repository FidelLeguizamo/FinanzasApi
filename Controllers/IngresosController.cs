using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanzasApi.Data;
using FinanzasApi.Models;
using System;
using System.Threading.Tasks;

namespace FinanzasApi.Controllers
{
    [Route("api/[controller]")] 
    [ApiController]
    public class IngresosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IngresosController(AppDbContext context)
        {
            _context = context;
        }

       
        [HttpPost]
        public async Task<IActionResult> CrearIngreso([FromBody] Ingreso nuevoIngreso)
        {
            
            if (nuevoIngreso == null || nuevoIngreso.Monto <= 0 || nuevoIngreso.IdUsuario <= 0)
            {
                return BadRequest("Datos de ingreso inválidos o incompletos.");
            }

            try
            {
                if (nuevoIngreso.Fecha == DateTime.MinValue)
                {
                    
                    nuevoIngreso.Fecha = DateTime.UtcNow;
                }
                else
                {
                    
                    nuevoIngreso.Fecha = DateTime.SpecifyKind(nuevoIngreso.Fecha, DateTimeKind.Utc);
                }

                
                _context.Ingresos.Add(nuevoIngreso);
                await _context.SaveChangesAsync();

               
                return Ok(nuevoIngreso);
            }
            catch (Exception ex)
            {
              
                var errorDetallado = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                return StatusCode(500, $"Error interno al guardar el ingreso: {errorDetallado}");
            }
        }
    }
}