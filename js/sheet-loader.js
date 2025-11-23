// Script para cargar datos de Google Sheet en el cliente
class GoogleSheetLoader {
  constructor(options = {}) {
    this.sheetId = options.sheetId || '1b2Mok3INzm5It1Af22FO5KLdk7SwehKWd15lWCMJZvM';
    this.gid = options.gid || '0';
    this.hasHeaders = options.hasHeaders !== false;
    this.apiEndpoint = options.apiEndpoint || '/api/sheet-data';
  }

  async getData() {
    try {
      const url = `${this.apiEndpoint}?sheetId=${this.sheetId}&gid=${this.gid}&headers=${this.hasHeaders}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      return result;
    } catch (error) {
      console.error('Error loading Google Sheet data:', error);
      throw error;
    }
  }

  async loadIntoTable(tableSelector, options = {}) {
    const table = document.querySelector(tableSelector);
    if (!table) {
      throw new Error(`Table not found: ${tableSelector}`);
    }

    try {
      const result = await this.getData();
      const { data, meta } = result;
      
      if (data.length === 0) {
        table.innerHTML = '<tr><td colspan="100%" class="text-center text-muted">No hay datos disponibles</td></tr>';
        return;
      }

      // Crear HTML de la tabla
      let html = '';
      
      // Headers (si existen)
      if (this.hasHeaders && data.length > 0) {
        const headers = Object.keys(data[0]);
        html += '<thead class="table-dark"><tr>';
        headers.forEach(header => {
          html += `<th>${header}</th>`;
        });
        html += '</tr></thead>';
      }

      // Body
      html += '<tbody>';
      data.forEach((row, index) => {
        html += '<tr>';
        Object.values(row).forEach(value => {
          const displayValue = options.formatCell ? 
            options.formatCell(value, row, index) : 
            value;
          html += `<td>${displayValue}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody>';

      table.innerHTML = html;

      // Disparar evento personalizado
      table.dispatchEvent(new CustomEvent('sheetDataLoaded', {
        detail: { data, meta }
      }));

      return result;
    } catch (error) {
      table.innerHTML = `<tr><td colspan="100%" class="text-center text-danger">Error: ${error.message}</td></tr>`;
      throw error;
    }
  }

  async loadIntoContainer(containerSelector, template, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }

    try {
      const result = await this.getData();
      const { data, meta } = result;
      
      if (data.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No hay datos disponibles</div>';
        return;
      }

      // Crear HTML usando template
      let html = '';
      data.forEach((row, index) => {
        const itemHtml = typeof template === 'function' ? 
          template(row, index) : 
          this.replaceTemplate(template, row, index);
        html += itemHtml;
      });

      container.innerHTML = html;

      // Disparar evento personalizado
      container.dispatchEvent(new CustomEvent('sheetDataLoaded', {
        detail: { data, meta }
      }));

      return result;
    } catch (error) {
      container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
      throw error;
    }
  }

  replaceTemplate(template, data, index) {
    let html = template;
    
    // Reemplazar placeholders {{columnName}}
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, data[key]);
    });
    
    // Reemplazar {{index}}
    html = html.replace(/{{\s*index\s*}}/g, index);
    
    return html;
  }
}

// Ejemplo de uso:
/*
// Cargar en tabla
const loader = new GoogleSheetLoader({
  sheetId: '1b2Mok3INzm5It1Af22FO5KLdk7SwehKWd15lWCMJZvM',
  gid: '0'
});

loader.loadIntoTable('#myTable', {
  formatCell: (value, row, index) => {
    // Formatear valores si es necesario
    if (!isNaN(value) && value !== '') {
      return parseFloat(value).toFixed(2);
    }
    return value;
  }
});

// Cargar en container con template
loader.loadIntoContainer('#products-container', `
  <div class="col-md-4">
    <div class="card">
      <div class="card-body">
        <h5>{{title}}</h5>
        <p>{{description}}</p>
        <span class="badge bg-primary">S/ {{price}}</span>
      </div>
    </div>
  </div>
`);
*/

// Exportar para uso global
window.GoogleSheetLoader = GoogleSheetLoader;
