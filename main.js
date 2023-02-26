// Definitions by: Ivan Shavrin <https://ISH.ru>
// Definitions: https://github.com/P1usW
// Version: 0.0.2


//Тестовые данные
const dataSet = [
    [[[60, 70], 40, 100, 400],
    [[50, 60], 70, 700, 300],
    [[40, 50], 100, 500, 280],
    [[30, 40], 80, 100, 300],
    [[20, 30], 50, 150,550],
    [[10, 20], 10, 100, 500],
    [[0, 10], 20, 800, 50],
    '2023-02-26'],


    [[[140, 150], 40, 100, 400],
    [[130, 140], 70, 700, 300],
    [[120, 130], 100, 500, 280],
    [[100, 120], 80, 100, 300],
    [[80, 100], 50, 150,550],
    [[60, 80], 10, 100, 500],
    [[40, 60], 20, 800, 50],
    '2023-02-27'],

    [[[100, 110], 30, 1000, 400],
    [[90, 100], 20, 70, 300],
    [[80, 90], 90, 50, 280],
    [[70, 80], 80, 100, 30],
    [[60, 70], 50, 150,50],
    [[50, 60], 100, 100, 50],
    [[40, 50], 100, 800, 50],
    '2023-02-28'],

    [[[70, 80], 30, 100, 400],
    [[60, 70], 20, 70, 700],
    [[50, 60], 90, 500, 280],
    [[40, 50], 80, 100, 130],
    [[30, 40], 50, 150,150],
    [[20, 30], 100, 100, 150],
    [[10, 20], 100, 800, 1050],
    '2023-03-1'],

    [[[200, 210], 40, 100, 400],
    [[190, 200], 70, 700, 300],
    [[180, 190], 100, 500, 280],
    [[170, 180], 80, 100, 300],
    [[160, 170], 50, 150,550],
    [[150, 160], 10, 100, 500],
    [[140, 150], 20, 800, 50],
    '2023-03-2'],
]


let graphTheme = new function () {
    this.textColor = `rgba(255, 255, 255, ${0.8}`;
    this.lineTableColor = `rgba(255, 255, 255, ${0.1}`;
    this.axisStyle = `rgba(255, 255, 255, ${0.8}`;
    this.cursorColor = `rgba(255, 255, 255, ${0.4}`;
    this.byeLevel = `rgb(0, 150, 0)`;
    this.cellLevel = `rgb(150, 0, 0)`;
}


class DataSet {
    constructor(dataSet) {
        this._dataSet = dataSet;
        this.dataSet = [];
        this.newData = true;
    }

    getDataSet() {
        if (!this.newData) return this.dataSet;

        for (let datas of this._dataSet) {
            let time = new Date(datas.pop())
            let kl = {
                opentime: [time.getMonth(), time.getDate()],
                klines: []
            }
            for (let data of datas) {
                kl.klines.push({
                    minPrice: data[0][0],
                    maxPrice: data[0][1],
                    struct: {
                        buyLevels: data[2],
                        sellLevels: data[3],
                        operand: data[1]
                    }
                })
            }
            this.dataSet.push(kl);
        }
        this.newData = false;
        return this.dataSet;
    }

    // Расчёт максимального значения
    static getMaxCount(dataSet) {
        let maxCount = 0;

        for (let datas of dataSet) {
            for (let data of datas.klines) {
                let sum = data.struct.buyLevels + data.struct.sellLevels;
                if (sum > maxCount) maxCount = sum;
            }
        }
        return maxCount;
    }
}


// Расчёт данных горизонтальных осей.
class Column {
    constructor(table) {
        this.table = table;
        this.cols = new Set();
        this.minValue = 0;
        this.maxValue = 0;
        this.step = this.table.graph.sizeTable.x;
    }

    createCols(dataSet, maxValue) {
        this.cols.clear();
        if (maxValue && maxValue > 0) {
            this.maxValue = maxValue;
        } else if (maxValue === 0) {
            this.maxValue = 1;
        } else {
            this.maxValue = dataSet.length <= 10 ? dataSet.length : 10;
        }

        for (let index = this.minValue; index < this.maxValue ; index++) {
            this.cols.add(index)
        }

        if (this.maxValue - this.minValue !== 0) this.step = this.table.graph.sizeTable.x / (this.maxValue - this.minValue)
        // if (this.maxValue - this.minValue !== 0) this.step = (this.table.graph.size.x - this.table.graph.ident) / (this.maxValue - this.minValue)
    }
}


// Расчёт данных вертикальных осей.
class Row {
    constructor(table) {
        this.table = table;
        this.rows = new Set();
        this.minValue = null;
        this.maxValue = null;
        this.step = 0;
    }

    createRows(dataSet) {
        this.rows.clear();
        for (let datas of dataSet) {
            for (let data of datas.klines) {
                if (typeof data === 'string') break;
                this.rows.add(data.minPrice).add(data.maxPrice);
            }
        }
        this.minValue = Math.min(...this.rows.values())
        this.maxValue = Math.max(...this.rows.values())

        this.step =this.table.graph.sizeTable.y / (this.maxValue - this.minValue)
    }
}


// Создание таблицы и хранение данных в Map
class Table {
    constructor(graph) {
        this.graph = graph;
        this.row = new Row(this);
        this.col = new Column(this);
        this.axisStep = {x: 0, y: 0}                            // шаг клетки по оси x и y
        this.arrayX = new Map;                                  // объект с координатами каждого значения по оси x
        this.arrayY = new Map;                                  // объект с координатами каждого значения по оси y
        this.numPoint = 10;
    }

    createTable(maxValueX) {
        this.arrayX.clear();
        this.arrayY.clear();
        this.row.createRows(this.graph.dataSet.getDataSet());
        this.col.createCols(this.graph.dataSet.getDataSet(), maxValueX);
        this.setAxis();
    }

    setAxis() {
        this.axisStep.y = this.graph.sizeTable.y / this.numPoint;
        this.axisStep.x = this.graph.sizeTable.x / this.col.cols.size;
        // this.axisStep.x = (this.graph.size.x - this.graph.ident) / this.col.cols.size;

        for (let j = this.graph.size.y - this.graph.ident, indexY = this.row.minValue; indexY <= this.row.maxValue;) {
            this.arrayY.set(indexY, j);
            j -= this.axisStep.y;

            indexY += (this.row.maxValue - this.col.minValue) / this.numPoint;
        }

        for (let i = this.graph.ident, indexX = this.col.minValue; i <= this.graph.size.x - this.graph.ident, indexX <= this.col.maxValue;) {
            this.arrayX.set(indexX, i);
            i += this.axisStep.x;
            indexX += 1;
        }
    }
}


class Canvas {
    constructor() {
        this.pixelRatio = window.devicePixelRatio;
        this.size = {x: 0, y: 0};                                       // размер канваса
        this.sizeTable = {x: 0, y: 0};                                  // размер канваса с учётов границ
        this.ident = 30 * this.pixelRatio;                              // отступы от границы канваса
        this.cnvDiv = document.querySelector('.cnv_container');
    }

    setCanvasSize(canvas) {
        canvas.style.width = Math.round(this.cnvDiv.offsetWidth) + 'px';
        canvas.style.height = Math.round(this.cnvDiv.offsetHeight) + 'px';

        this.size.x = canvas.width = Math.round(this.cnvDiv.offsetWidth * this.pixelRatio);
        this.size.y = canvas.height = Math.round(this.cnvDiv.offsetHeight * this.pixelRatio);

        this.sizeTable.x = this.size.x - this.ident * 2;
        this.sizeTable.y = this.size.y - this.ident * 2;
    }

    resizeCanvas() {
        this.pixelRatio = window.devicePixelRatio
        this.ident = 30 * this.pixelRatio;
    }
}


// Вспомогательный класс для отрисовки вспомогательных осей и других данных.
// В отличие от основного класса, здесь используется анимация для отрисовки осей
// по кадрам. (requestAnimationFrame)
// Здесь расписана логика и события мыши, которые не нагружают основной canvas.
class Helper extends Canvas{
    constructor(graph, table) {
        super();
        this.graph = graph;
        this.cursor = {x: this.graph.ident, y: this.graph.ident};   // координаты курсора
        this.inGraph = false;                                       // флаг нахождения курсора в канвасе
        this.canvas = document.getElementById('helper');
        this.ctx = this.canvas.getContext('2d');
        this.table = table;

        this.btnDown = document.getElementById('down');
        this.btnUp = document.getElementById('up');
        this.btnUpdate = document.getElementById('update');

        this.setCursor = this.setCursor.bind(this);
        this.reduceX = this.reduceX.bind(this);
        this.increaseX = this.increaseX.bind(this);
        this.updateCtx = this.updateCtx.bind(this);
        this.resizeCanvas = this.resizeCanvas.bind(this);


        this.reqId = null;
    }

    setCanvasSize() {
        super.setCanvasSize(this.canvas);
    }

    resizeCanvas() {
        super.resizeCanvas();
        this.setCanvasSize()
    }

    // Событие мыши, которое задаёт координаты
    setCursor(event) {
        let cursorX = event.offsetX * this.pixelRatio;
        let cursorY = event.offsetY * this.pixelRatio;

        if (cursorX <= this.ident) {this.cursor.x = this.ident;}
        else if (cursorX >= this.size.x - this.ident) {this.cursor.x = this.size.x - this.ident;}
        else this.cursor.x = cursorX;

        if (cursorY <= this.ident) {this.cursor.y = this.ident;}
        else if (cursorY >= this.size.y - this.ident) {this.cursor.y = this.size.y - this.ident;}
        else this.cursor.y = cursorY;
    }

    drawCursor() {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.graph.graphTheme.cursorColor;
        this.ctx.setLineDash([15, 15]);
        this.ctx.moveTo(this.cursor.x, this.ident);
        this.ctx.lineTo(this.cursor.x, this.size.y - this.ident);
        this.ctx.moveTo(this.ident, this.cursor.y);
        this.ctx.lineTo(this.size.x - this.ident, this.cursor.y);
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.setLineDash([]);
    }

    drawValue() {
        let curY = this.cursor.y + this.ident;
        let value = Math.round((this.size.y - curY) / (this.sizeTable.y) * this.table.row.maxValue);

        this.ctx.beginPath();
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.8}`;
        this.ctx.font = this.graph.font;
        this.ctx.fillText(`cost: ${value}`, this.ident, this.ident / 2);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    drawPriceLevels() {
        let WH = 10 * this.pixelRatio;
        for (let [path, data] of this.graph.arrPath) {
            if (this.ctx.isPointInPath(path, this.cursor.x, this.cursor.y)) {
                this.ctx.beginPath();
                this.ctx.fillStyle = `rgba(255, 255, 255, ${data[1] / 100}`;
                this.ctx.fillRect(this.ident * 4, this.ident / 2, WH, -WH);
                this.ctx.fillStyle = this.graph.graphTheme.byeLevel;
                this.ctx.fillRect(this.ident * 6, this.ident / 2, WH, -WH);
                this.ctx.fillStyle = this.graph.graphTheme.cellLevel;
                this.ctx.fillRect(this.ident * 8, this.ident / 2, WH, -WH);
                this.ctx.font = this.graph.font;
                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.8}`;
                this.ctx.fillText(`${data.struct.operand}`, this.ident * 4.5, this.ident / 2);
                this.ctx.fillText(`${data.struct.buyLevels}`, this.ident * 6.5, this.ident / 2);
                this.ctx.fillText(`${data.struct.sellLevels}`, this.ident * 8.5, this.ident / 2);
                this.ctx.stroke();
                this.ctx.closePath();
                break;
            }
        }
    }

    increaseX() {
        let value = this.table.col.maxValue + 1;
        this.graph.resize(value);
    }

    reduceX() {
        let value = this.table.col.maxValue - 1;
        this.graph.resize(value);
    }

    scrollX(event) {
    }

    updateCtx() {
        this.table.createTable();
        this.graph.loop();
    }

    addEvents() {
        this.canvas.addEventListener('mousemove', this.setCursor);
        this.canvas.addEventListener('mouseenter', () => this.inGraph = true);
        this.canvas.addEventListener('mouseleave', () => this.inGraph = false);
        // this.canvas.addEventListener('pointerdown', this.scrollX);
        // this.canvas.addEventListener('pointerup', this.scrollX);
        // this.canvas.addEventListener('pointerenter', this.scrollX)
        // this.canvas.addEventListener('pointerleave', this.scrollX)
        this.btnUp.addEventListener('click', this.increaseX);
        this.btnDown.addEventListener('click', this.reduceX);
        this.btnUpdate.addEventListener('click', this.updateCtx);
    }

    init() {
        this.addEvents();
        window.addEventListener('resize', this.resizeCanvas);
        this.setCanvasSize();
        this.loop();
    }

    updateHelper() {
        this.ctx.clearRect(0, 0, this.graph.size.x, this.graph.size.y);
        if (this.inGraph) this.drawCursor();
        this.drawValue();
        this.drawPriceLevels();
    }

    loop() {
        this.updateHelper();
        if(this.reqId) cancelAnimationFrame(this.reqId);
        this.reqId = requestAnimationFrame(() => this.loop());
    }
}


// Основной класс, который отрисовывает графики.
// Использовать нужно только его, остальные классы нужны для разделения кода.
class Graph extends Canvas{
    constructor(dataSet) {
        super();
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.dataSet = new DataSet(dataSet);
        this.table = new Table(this);
        this.helper = new Helper(this, this.table);
        this.graphTheme = graphTheme;

        this.arrPath = new Map();

        this.font = `${Math.round(12*this.pixelRatio)}px serif`;

        this.resizeCanvas = this.resizeCanvas.bind(this);
        this.resize = this.resize.bind(this);
    }

    setCanvasSize() {
        super.setCanvasSize(this.canvas);
    }

    resizeCanvas() {
        super.resizeCanvas();
        this.font = `${Math.round(12*this.pixelRatio)}px serif`;
        this.setCanvasSize();
        this.resize();
    }

    resize(value) {
        this.table.createTable(value)
        this.updateCanvas();
    }

    // Отрисовка осей
    drawAxis() {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.graphTheme.axisStyle;
        this.ctx.moveTo(this.ident, this.ident);
        this.ctx.lineTo(this.ident, this.size.y - this.ident);
        this.ctx.lineTo(this.size.x, this.size.y - this.ident);

        this.ctx.stroke();
    }

    // Отрисовка таблицы
    drawTable() {
        this.ctx.setLineDash([20, 20]);

        // Отрисовка вертикальных осей таблицы
        // Отрисовка значений по оси y
        for (let i of this.table.arrayY.entries()) {
            this.ctx.beginPath();
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = this.graphTheme.textColor;
            this.ctx.font = this.font;
            this.ctx.fillText(`${i[0]}`, this.ident * 0.9, i[1]);
            this.ctx.strokeStyle = this.graphTheme.lineTableColor;
            this.ctx.moveTo(this.ident, i[1]);
            this.ctx.lineTo(this.size.x, i[1]);
            this.ctx.stroke();
            this.ctx.closePath();
        }

        // Отрисовка горизонтальных осей таблицы
        // Отрисовка значений по оси x
        for (let j of this.table.arrayX.entries()) {
            this.ctx.beginPath();
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = this.graphTheme.textColor;
            this.ctx.font = this.font;
            this.ctx.fillText(`${j[0]} Feb`, j[1], this.size.y - this.ident * 0.5);
            this.ctx.strokeStyle = this.graphTheme.lineTableColor;
            this.ctx.moveTo(j[1], this.ident);
            this.ctx.lineTo(j[1], this.size.y - this.ident);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        this.ctx.setLineDash([]);
    }

    // Отрисовка данных
    drawData() {
        let allData = this.dataSet.getDataSet();
        let maxCount = DataSet.getMaxCount(allData);
        let sizeCost = this.table.axisStep.x / 10;
        let indexX = 0;

        this.arrPath.clear();

        for (let datas of allData) {
            for (let data of datas.klines) {
                let h = Math.floor((data.maxPrice - data.minPrice) * this.table.row.step);
                let x = Math.floor(this.table.arrayX.get(indexX));
                let y = Math.floor((this.size.y - this.ident) - data.minPrice * this.table.row.step);

                let dataBye = data.struct.buyLevels;
                let dataSell = data.struct.sellLevels
                let _sizeBye = (dataBye / maxCount) * (this.table.axisStep.x - sizeCost);
                let _sizeSell = (dataSell / maxCount) * (this.table.axisStep.x - sizeCost);

                let p = new Path2D();
                p.rect(x, y, this.table.col.step, -h)
                this.arrPath.set(p, data);

                this.ctx.beginPath();
                this.ctx.strokeStyle = 'rgb(20, 20, 20)'
                this.ctx.fillStyle = `rgba(255, 255, 255, ${data.struct.operand / 100}`;
                this.ctx.rect(x, y, sizeCost, -h);
                this.ctx.stroke();
                this.ctx.fill();
                this.ctx.closePath();
                this.ctx.beginPath();
                this.ctx.fillStyle = this.graphTheme.byeLevel;
                this.ctx.rect(x + sizeCost, y, _sizeBye, -h);
                this.ctx.stroke();
                this.ctx.fill();
                this.ctx.closePath();
                this.ctx.beginPath();
                this.ctx.fillStyle = this.graphTheme.cellLevel;
                this.ctx.rect(x + sizeCost + _sizeBye, y, _sizeSell, -h);
                this.ctx.stroke();
                this.ctx.fill();
                this.ctx.closePath();
            }
            indexX += 1;
        }
    }

    updateCanvas() {
        // this.ctx.fillStyle = this.backgroundStyle;
        // this.ctx.fillRect(0, 0, this.size.x, this.size.y);
        this.ctx.clearRect(0, 0, this.size.x, this.size.y);
        this.drawAxis();
        this.drawTable();
        this.drawData();
    }

    // Метод, который необходимо вызвать для начала отрисовки
    init() {
        this.setCanvasSize();
        this.table.createTable();
        this.helper.init();
        window.addEventListener('resize', this.resizeCanvas);
        this.loop();
    }

    loop() {
        this.updateCanvas();
    }
}

const graph = new Graph(dataSet);
graph.init();
