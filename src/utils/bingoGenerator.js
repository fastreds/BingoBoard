// Generador pseudoaleatorio con semilla
export function seededRandom(seed) {
  const modulus = 2 ** 31 - 1;
  const multiplier = 16807;
  const nextSeed = (seed * multiplier) % modulus;
  return {
    val: nextSeed / modulus,
    nextSeed: nextSeed
  };
}

// Generar un cartón de bingo único y repetible a partir de una semilla
export function generarCarton(seed) {
  const carton = [];
  const columnas = [
    { rango: [1, 15], numeros: [] },
    { rango: [16, 30], numeros: [] },
    { rango: [31, 45], numeros: [] },
    { rango: [46, 60], numeros: [] },
    { rango: [61, 75], numeros: [] },
  ];

  let currentSeed = seed || 1;

  columnas.forEach((columna, colIndex) => {
    const numeros = new Set();
    // Variación por columna para que las semillas generen patrones variados
    let colSeed = currentSeed + colIndex * 1000;
    
    while (numeros.size < 5) {
      colSeed = Math.abs(colSeed) || 1;
      const res = seededRandom(colSeed);
      const random = res.val;
      const numero = Math.floor(random * (columna.rango[1] - columna.rango[0] + 1)) + columna.rango[0];
      numeros.add(numero);
      colSeed = Math.floor(random * 1e6);
    }
    columna.numeros = [...numeros].sort((a, b) => a - b);
  });

  // Formar filas del cartón (5 filas x 5 columnas)
  for (let i = 0; i < 5; i++) {
    carton.push(
      columnas.map((columna, colIndex) => {
        if (colIndex === 2 && i === 2) {
          return "FREE";
        }
        return columna.numeros[i];
      })
    );
  }

  return carton;
}

// Comprobar si un cartón con un conjunto de números cantados cumple un patrón
export function checkPatternMatch(carton, drawnNumbers, pattern) {
  // Construir matriz de celdas marcadas (true si es FREE o si está en drawnNumbers)
  const marked = carton.map(row => 
    row.map(cell => cell === "FREE" || drawnNumbers.includes(cell))
  );

  switch (pattern) {
    case "Full Card":
      return marked.flat().every(Boolean);

    case "Row":
      // Alguna fila completa
      return marked.some(row => row.every(Boolean));

    case "Column":
      // Alguna columna completa
      for (let col = 0; col < 5; col++) {
        let colComplete = true;
        for (let row = 0; row < 5; row++) {
          if (!marked[row][col]) {
            colComplete = false;
            break;
          }
        }
        if (colComplete) return true;
      }
      return false;

    case "Diagonal":
      // Diagonal principal o secundaria
      const diag1 = [marked[0][0], marked[1][1], marked[2][2], marked[3][3], marked[4][4]].every(Boolean);
      const diag2 = [marked[0][4], marked[1][3], marked[2][2], marked[3][1], marked[4][0]].every(Boolean);
      return diag1 || diag2;

    case "Corners":
      // Cuatro esquinas
      return marked[0][0] && marked[0][4] && marked[4][0] && marked[4][4];

    case "L Shape":
      // Columna izquierda + Fila inferior
      const leftCol = [marked[0][0], marked[1][0], marked[2][0], marked[3][0], marked[4][0]].every(Boolean);
      const bottomRow = marked[4].every(Boolean);
      return leftCol && bottomRow;

    case "X Shape":
      // Ambas diagonales cruzadas
      const cross1 = [marked[0][0], marked[1][1], marked[2][2], marked[3][3], marked[4][4]].every(Boolean);
      const cross2 = [marked[0][4], marked[1][3], marked[2][2], marked[3][1], marked[4][0]].every(Boolean);
      return cross1 && cross2;

    default:
      return false;
  }
}
