const STORAGE_KEY = "bitacoras_mejora_continua_v1";

const EJEMPLOS = [
    {
        fechaRecepcion: "2026-11-10",
        codigoBitacora: "BIT-2026-001",
        nombreBitacora: "Control Ambiental Sala Empaque",
        codigoInterno: "REG-MC-014",
        numeroCaja: "CAJA-01",
        responsable: "L. Araya",
        fechaApertura: "2026-11-01",
        fechaCierre: "2026-11-09",
        observaciones: "Digitalizada sin observaciones"
    },
    {
        fechaRecepcion: "2026-11-18",
        codigoBitacora: "BIT-2026-002",
        nombreBitacora: "Limpieza Línea Blíster 3",
        codigoInterno: "REG-MC-022",
        numeroCaja: "CAJA-01",
        responsable: "L. Araya",
        fechaApertura: "2026-11-12",
        fechaCierre: "",
        observaciones: "Pendiente firma de cierre"
    },
    {
        fechaRecepcion: "2026-11-22",
        codigoBitacora: "BIT-2026-003",
        nombreBitacora: "Verificación Balanzas Pesaje",
        codigoInterno: "REG-MC-031",
        numeroCaja: "CAJA-02",
        responsable: "L. Araya",
        fechaApertura: "2026-11-15",
        fechaCierre: "2026-11-21",
        observaciones: "Archivada en caja 2"
    }
];

let registros = cargarDatos();

function cargarDatos() {
    try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        return guardado ? JSON.parse(guardado) : [...EJEMPLOS];
    } catch {
        return [...EJEMPLOS];
    }
}

function guardarEnStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
    } catch (e) {
        console.warn("No se pudo usar localStorage:", e);
    }
}

function mostrarAlerta(texto, tipo = "ok") {
    const alerta = document.getElementById("alerta");
    alerta.textContent = texto;
    alerta.className = `alerta ${tipo}`;
    setTimeout(() => alerta.classList.add("oculto"), 4000);
}

function renderizar() {
    const textoFiltro = document.getElementById("buscador").value.toLowerCase();
    const estadoFiltro = document.getElementById("filtroEstado").value;
    const tbody = document.getElementById("tabla-body");

    const filtrados = registros.filter((r) => {
        const estado = r.fechaCierre ? "CERRADA" : "ABIERTA";
        const coincideEstado = estadoFiltro === "TODAS" || estado === estadoFiltro;
        const coincideTexto =
            r.codigoBitacora.toLowerCase().includes(textoFiltro) ||
            r.nombreBitacora.toLowerCase().includes(textoFiltro) ||
            r.codigoInterno.toLowerCase().includes(textoFiltro) ||
            r.numeroCaja.toLowerCase().includes(textoFiltro);
        return coincideEstado && coincideTexto;
    });

    tbody.innerHTML = filtrados
        .map((r) => {
            const cerrada = Boolean(r.fechaCierre);
            return `
        <tr>
          <td><span class="badge ${cerrada ? "badge-cerrada" : "badge-abierta"}">${cerrada ? "Cerrada" : "Abierta"}</span></td>
          <td>${r.fechaRecepcion}</td>
          <td><strong>${r.codigoBitacora}</strong></td>
          <td>${r.nombreBitacora}</td>
          <td>${r.codigoInterno}</td>
          <td>${r.numeroCaja}</td>
          <td>${r.responsable}</td>
          <td>${r.fechaApertura}</td>
          <td>${r.fechaCierre || "-"}</td>
          <td>${r.observaciones || "-"}</td>
          <td>
            ${!cerrada ? `<button class="btn btn-success btn-sm" onclick="cerrarBitacora('${r.codigoBitacora}')">Cerrar hoy</button>` : ""}
            <button class="btn btn-danger btn-sm" onclick="eliminarBitacora('${r.codigoBitacora}')">Eliminar</button>
          </td>
        </tr>
      `;
        })
        .join("");

    document.getElementById("kpi-total").textContent = registros.length;
    document.getElementById("kpi-abiertas").textContent = registros.filter((r) => !r.fechaCierre).length;
    document.getElementById("kpi-cerradas").textContent = registros.filter((r) => r.fechaCierre).length;
}

document.getElementById("btn-exportar").addEventListener("click", () => {
    if (!registros.length) {
        mostrarAlerta("No hay registros para exportar.", "error");
        return;
    }

    const encabezados = [
        "Fecha Recepción",
        "Código Bitácora",
        "Nombre Bitácora",
        "Código Interno",
        "N° Caja",
        "Quién guardó el documento",
        "Fecha Apertura",
        "Fecha Cierre",
        "Observaciones"
    ];

    const anchosColumnas = [16, 18, 34, 18, 14, 24, 18, 18, 32];

    const escaparHtml = (valor) =>
        String(valor || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    const colgroup = anchosColumnas
        .map((width) => `<col width="${width * 7}">`)
        .join("");

    const thCells = encabezados
        .map(
            (titulo) => `
        <th style="
          background-color: #d3d3d3;
          color: #000000;
          font-weight: bold;
          text-align: center;
          vertical-align: middle;
          border: 0.5pt solid #000000;
          padding: 6px 8px;
          white-space: normal;
        ">${escaparHtml(titulo)}</th>
      `
        )
        .join("");

    const filasHtml = registros
        .map((r) => {
            const valores = [
                r.fechaRecepcion,
                r.codigoBitacora,
                r.nombreBitacora,
                r.codigoInterno,
                r.numeroCaja,
                r.responsable,
                r.fechaApertura,
                r.fechaCierre,
                r.observaciones
            ];

            const tds = valores
                .map(
                    (val) => `
            <td style="
              background-color: #ffffff;
              color: #000000;
              text-align: center;
              vertical-align: middle;
              border: 0.5pt solid #000000;
              padding: 6px 8px;
              white-space: nowrap;
            ">${escaparHtml(val)}</td>
          `
                )
                .join("");

            return `<tr style="height: 28px;">${tds}</tr>`;
        })
        .join("");

    const ultimaColLetra = "I";
    const ultimaFila = registros.length + 1;

    const htmlHoja = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Bitácoras</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
              <x:AutoFilter x:Range="A1:${ultimaColLetra}${ultimaFila}" />
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      <table style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11pt;">
        <colgroup>${colgroup}</colgroup>
        <thead>
          <tr style="height: 38px;">${thCells}</tr>
        </thead>
        <tbody>
          ${filasHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

    const blob = new Blob(["\uFEFF" + htmlHoja], {
        type: "application/vnd.ms-excel;charset=utf-8;"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bitacoras_mejora_continua_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
});

window.cerrarBitacora = function (codigo) {
    const hoy = new Date().toISOString().split("T")[0];
    registros = registros.map((r) => (r.codigoBitacora === codigo ? { ...r, fechaCierre: hoy } : r));
    guardarEnStorage();
    renderizar();
    mostrarAlerta(`Bitácora ${codigo} marcada como cerrada (${hoy}).`, "ok");
};

window.eliminarBitacora = function (codigo) {
    registros = registros.filter((r) => r.codigoBitacora !== codigo);
    guardarEnStorage();
    renderizar();
    mostrarAlerta(`Registro ${codigo} eliminado.`, "ok");
};

document.getElementById("btn-exportar").addEventListener("click", () => {
    if (!registros.length) {
        mostrarAlerta("No hay registros para exportar.", "error");
        return;
    }

    const encabezados = [
        "Fecha Recepción", "Código Bitácora", "Nombre Bitácora", "Código Interno",
        "N° Caja", "Quién guardó el documento", "Fecha Apertura", "Fecha Cierre", "Observaciones"
    ];

    const filas = registros.map((r) => [
        r.fechaRecepcion, r.codigoBitacora, r.nombreBitacora, r.codigoInterno,
        r.numeroCaja, r.responsable, r.fechaApertura, r.fechaCierre, r.observaciones
    ].map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(";"));

    const csv = "\uFEFF" + [encabezados.join(";"), ...filas].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bitacoras_mejora_continua_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
});

document.getElementById("btn-ejemplos").addEventListener("click", () => {
    registros = [...EJEMPLOS];
    guardarEnStorage();
    renderizar();
    mostrarAlerta("Ejemplos restaurados.", "ok");
});

document.getElementById("btn-limpiar").addEventListener("click", () => {
    registros = [];
    guardarEnStorage();
    renderizar();
    mostrarAlerta("Tabla vaciada.", "ok");
});

document.getElementById("buscador").addEventListener("input", renderizar);
document.getElementById("filtroEstado").addEventListener("change", renderizar);

renderizar();