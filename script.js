document.addEventListener("keydown", handleKeyPress);

const form = document.getElementById("newGameForm");
let game;

document.getElementById("newGame").addEventListener("click", handleStartGame);

function randomNumberInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createLabel(className, text) {
    let label = document.createElement("label");
    label.className = className;
    label.innerText = text;
    return label;
}

function handleStartGame(event) {
    event.preventDefault();
    let isDataCorrect, errorMessage;
    Grid.removeGridIfExist();
    [isDataCorrect, errorMessage] = Game.validateValues(form.elements[0].value,
        form.elements[1].value,
        form.elements[2].value);
    if (isDataCorrect) {
        game = new Game(
            form.elements[0].value,
            form.elements[1].value,
            form.elements[2].value,
            form.elements[3].value,
            form.elements[4].value
        );
    } else {
        alert(errorMessage);
    }
}


function handleKeyPress(event) {
    switch (event.keyCode) {
        case 37: {
            game.moveLeft();
            break;
        }
        case 38: {
            game.moveUp();
            break;
        }
        case 39: {
            game.moveRight();
            break;
        }
        case 40: {
            game.moveDown();
            break;
        }
        case 32: {
            if (event.target.id == "newGame") {
                event.preventDefault();
            }
            game.takeBox();
            break;
        }

    }
}

function handleDragStart(event) {
    event.dataTransfer.setData("warehouseIndex", event.target.getAttribute("index"));
}

function handleDragOver(event) {
    event.preventDefault();
}

function handleDrop(event) {
    const warehouseIndex = event.dataTransfer.getData("warehouseIndex");
    game.transferBoxToExit(warehouseIndex);
}

class Game {
    constructor(numberOfRows,
        numberOfColumns,
        numberOfWarehouses,
        maxNumberOfBoxesInWarehouse,
        maxNumberOfBoxesInCharacter) {
        this.numberOfRows = numberOfRows;
        this.numberOfColumns = numberOfColumns;
        this.numberOfWarehouses = numberOfWarehouses;
        this.maxNumberOfBoxesInWarehouse = maxNumberOfBoxesInWarehouse;
        this.maxNumberOfBoxesInCharacter = maxNumberOfBoxesInCharacter;

        this.grid = new Grid(numberOfRows, numberOfColumns);
        [this.warehouses, this.numberOfAllBoxes] =
            Warehouse.createWarehouses(numberOfWarehouses, maxNumberOfBoxesInWarehouse);
        Warehouse.placeWarehouses(this.warehouses, this.grid.cells);
        this.character = new Character(maxNumberOfBoxesInCharacter,
            this.grid.cells.length - 1);
        this.character.placeCharacterInCell(this.grid.cells[this.grid.cells.length - 1]);
        this.createResultText(0);
    }

    static validateValues(numberOfRows, numberOfColumns, numberOfWarehouses) {
        if (numberOfRows * numberOfColumns >= numberOfWarehouses) {
            return [true, ""];
        } else {
            return [false, "Количество складов больше чем размерность поля"];
        }
    }

    moveLeft() {
        this.character.moveLeft(this.grid.cells, this.numberOfColumns, this.numberOfRows);
    }

    moveUp() {
        this.character.moveUp(this.grid.cells, this.numberOfColumns, this.numberOfRows);
    }

    moveRight() {
        this.character.moveRight(this.grid.cells, this.numberOfColumns, this.numberOfRows);
    }

    moveDown() {
        this.character.moveDown(this.grid.cells, this.numberOfColumns, this.numberOfRows);
        if (this.grid.cells[this.character.position].classList.contains("exit")) {
            this.createResultText(this.character.numberOfMovedBoxes);
            this.character.numberOfBoxes = 0;
            if (this.character.numberOfMovedBoxes == this.numberOfAllBoxes) {
                alert("Вы перенесли все ящики");
            }
        }
    }

    takeBox() {
        this.character.takeBox(this.warehouses, this.grid.cells);
    }

    transferBoxToExit(warehouseIndex) {
        const targetWarehouse = this.warehouses.find(element => element.position == warehouseIndex);
        if (targetWarehouse.numberOfBoxes > 0) {
            targetWarehouse.numberOfBoxes--;
            targetWarehouse.refreshCell(this.grid.cells);
            this.character.numberOfMovedBoxes++;
            if (this.character.numberOfMovedBoxes == this.numberOfAllBoxes) {
                alert("Вы перенесли все ящики");
            }
            this.createResultText(this.character.numberOfMovedBoxes);
        } else {
            alert("Нечего переносить");
        }

    }

    createResultText(numberOfBoxes) {
        const p = document.getElementById("result");
        p.innerText = `Всего перенесено ${numberOfBoxes} ящиков`;
    }

};

class Grid {
    constructor(numberOfRows, numberOfColumns) {
        this.numberOfRows = numberOfRows;
        this.numberOfColumns = numberOfColumns;
        document.getElementById("root").appendChild(this.createGrid(numberOfRows, numberOfColumns));
        this.cellsOfGrid = document.getElementsByClassName("cell");
    }

    get rows() {
        return this.numberOfRows;
    }

    get columns() {
        return this.numberOfColumns;
    }

    get cells() {
        return this.cellsOfGrid;
    }

    static removeGridIfExist() {
        if (document.getElementById("grid")) {
            document.getElementById("root").removeChild(document.getElementById("grid"));
        }
    }

    createGrid(numberOfRows, numberOfColumns) {
        let grid = document.createElement("div");
        grid.className = "grid";
        grid.setAttribute("id", "grid");
        for (var i = 0; i < numberOfRows; i++) {
            grid.appendChild(this.createRow(numberOfColumns, i));
        }
        grid.appendChild(this.createExit());
        return grid;
    }

    createRow(numberOfColumns, rowIndex) {
        let cell, row = document.createElement("div");
        row.className = "row";
        for (var i = 0; i < numberOfColumns; i++) {
            cell = document.createElement("div");
            cell.className = "cell";
            cell.setAttribute("index", rowIndex * numberOfColumns + i);
            row.appendChild(cell);
        }
        return row;
    }

    createExit() {
        let row = document.createElement("div"),
            cell = document.createElement("div");
        row.className = "row";
        cell.classList.add("cell");
        cell.classList.add("exit");
        cell.addEventListener("dragover", handleDragOver);
        cell.addEventListener("drop", handleDrop);
        row.appendChild(cell);
        return row;
    }
};

class Warehouse {
    constructor(maxNumberOfBoxesInWarehouse) {
        this.numberOfBoxesInWarehouse = randomNumberInRange(1, maxNumberOfBoxesInWarehouse);
        this.positionOfWarehouse = -1;
    }

    static createWarehouses(numberOfWarehouses, maxNumberOfBoxesInWarehouse) {
        let warehouses = [], numberOfAllBoxes = 0;
        for (var i = 0; i < numberOfWarehouses; i++) {
            warehouses.push(new Warehouse(maxNumberOfBoxesInWarehouse));
            numberOfAllBoxes += warehouses[i].numberOfBoxes;
        }
        return [warehouses, numberOfAllBoxes];
    }

    static placeWarehouses(warehouses, cells) {
        warehouses.forEach(element => {
            element.placeWarehouse(cells);
        });
    }

    get numberOfBoxes() {
        return this.numberOfBoxesInWarehouse;
    }

    set numberOfBoxes(newNumberOfBoxes) {
        this.numberOfBoxesInWarehouse = newNumberOfBoxes;
    }

    get position() {
        return this.positionOfWarehouse;
    }

    set position(newPosition) {
        this.positionOfWarehouse = newPosition;
    }

    placeWarehouse(cells) {
        var placeOfWarehouse = randomNumberInRange(0, cells.length - 1);
        while (cells[placeOfWarehouse].classList.contains("warehouse") ||
            cells[placeOfWarehouse].classList.contains("exit")) {
            placeOfWarehouse = randomNumberInRange(0, cells.length - 1);
        }
        this.position = placeOfWarehouse;
        cells[placeOfWarehouse].classList.add("warehouse");
        cells[placeOfWarehouse].setAttribute("draggable", true);
        cells[placeOfWarehouse].addEventListener("dragstart", handleDragStart);
        cells[placeOfWarehouse].appendChild(createLabel("number", this.numberOfBoxes));
        cells[placeOfWarehouse].appendChild(createLabel("logo", "Склад"));
    }

    refreshCell(cells) {
        cells[this.position].firstChild.innerText = this.numberOfBoxes;
    }

};

class Character {
    constructor(maxNumberOfBoxesInCharacter, startPosition) {
        this.maxNumberOfBoxes = maxNumberOfBoxesInCharacter;
        this.currentNumberOfBoxes = 0;
        this.numberOfMovedBoxes = 0;
        this.positionOnGrid = startPosition;
    }

    get maximumNumberOfBoxes() {
        return this.maxNumberOfBoxes;
    }

    set numberOfBoxes(newNumberOfBoxes) {
        this.currentNumberOfBoxes = newNumberOfBoxes;
    }

    get numberOfBoxes() {
        return this.currentNumberOfBoxes;
    }

    get position() {
        return this.positionOnGrid;
    }

    set position(newPosition) {
        this.positionOnGrid = newPosition;
    }

    placeCharacterInCell(cell, prevCell) {
        let character = document.createElement("img");
        character.setAttribute("src", "char.png");
        if (prevCell != undefined) {
            if (cell != prevCell) {
                if (prevCell.children.length > 1) {
                    prevCell.removeChild(prevCell.children[1]);
                } else {
                    prevCell.removeChild(prevCell.children[0]);
                }
            }
        }

        if (cell != prevCell) {
            if (cell.firstChild) {
                cell.insertBefore(character, cell.lastChild);
            } else {
                cell.appendChild(character);
            }
        }
    }

    moveLeft(cells, numberOfColumns, numberOfRows) {
        if (this.position != numberOfColumns * numberOfRows) {
            const newPosition = this.getNewPosition("left", numberOfColumns, numberOfRows);
            this.placeCharacterInCell(cells[newPosition], cells[this.position]);
            this.position = newPosition;
        }
    }

    moveRight(cells, numberOfColumns, numberOfRows) {
        if (this.position != numberOfColumns * numberOfRows) {
            const newPosition = this.getNewPosition("right", numberOfColumns, numberOfRows);
            this.placeCharacterInCell(cells[newPosition],
                cells[this.position]);
            this.position = newPosition;
        }
    }

    moveUp(cells, numberOfColumns, numberOfRows) {
        let newPosition;
        if (this.position == numberOfColumns * numberOfRows) {
            newPosition = numberOfColumns * numberOfRows - 1;
        } else {
            newPosition = this.getNewPosition("up", numberOfColumns, numberOfRows);
        }
        this.placeCharacterInCell(cells[newPosition],
            cells[this.position]);
        this.position = newPosition;
    }

    moveDown(cells, numberOfColumns, numberOfRows) {
        if (this.position != numberOfColumns * numberOfRows) {
            let newPosition;
            if (this.position == numberOfColumns * numberOfRows - 1) {
                newPosition = numberOfColumns * numberOfRows;
            } else {
                newPosition = this.getNewPosition("down", numberOfColumns, numberOfRows);
            }
            this.placeCharacterInCell(cells[newPosition],
                cells[this.position]);
            this.position = newPosition;
        }
    }

    getNewPosition(direction, numberOfColumns, numberOfRows) {
        let previousRow = this.getRow(numberOfColumns),
            previousColumn = this.getColumn(numberOfColumns),
            newRow = previousRow, newColumn = previousColumn;
        switch (direction) {
            case "left": {
                if (previousColumn - 1 > - 1) {
                    newColumn = previousColumn - 1;
                }
                break;
            }
            case "right": {
                if (previousColumn + 1 < numberOfColumns) {
                    newColumn = previousColumn + 1;
                }
                break;
            }
            case "up": {
                if (previousRow - 1 > - 1) {
                    newRow = previousRow - 1;
                }
                break;
            }
            case "down": {
                if (previousRow + 1 < numberOfRows) {
                    newRow = previousRow + 1;
                }
                break;
            }
            default: {
                newRow = previousRow;
                newColumn = previousColumn;
            }
        }
        return newRow * numberOfColumns + newColumn;

    }

    getRow(numberOfColumns) {
        return Math.floor(this.position / numberOfColumns);
    }

    getColumn(numberOfColumns) {
        return this.position % numberOfColumns;
    }

    takeBox(warehouses, cells) {
        let warehouse = warehouses.find(element => element.position == this.position);
        if (warehouse != undefined) {
            if (warehouse.numberOfBoxes > 0) {
                if (this.numberOfBoxes + 1 <= this.maximumNumberOfBoxes) {
                    this.numberOfBoxes++;
                    this.numberOfMovedBoxes++;
                    warehouse.numberOfBoxes--;
                    warehouse.refreshCell(cells);
                } else {
                    alert(`Вы не можете переносить больше ${this.maximumNumberOfBoxes} ящиков`);
                }
            }
        }
    }

};
