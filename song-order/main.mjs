import findBestSolution from './findBestSolution.mjs'

const data = [
    ['Smith', 'John', 'Catch a Falling Star', 'Midnight Ride', '', '2'],
    ['Johnson', 'Jane', 'Yankee Doodle', 'Midnight Ride', '', '3'],
    ['Williams', 'Emily', 'Shining Stars', 'Ode To Joy', '', '2'],
    ['Brown', 'Michael', 'russian folk song', 'roman trumpets', '', '2'],
    ['Jones', 'Sarah', 'Midnight Ride', 'Chasing Kou', '', '2'],
    ['Garcia', 'David', 'Eine Kleine', 'Shining Stars', '', '1'],
    ['Martinez', 'Laura', 'A Little Night Music', 'Jingle Bells', '', '1'],
    ['Rodriguez', 'James', 'New World Symphony', 'Midnight Ride', 'First', '1'],
    ['Hernandez', 'Mary', 'Happy birthday', 'Yankee Doodle', '', '2'],
    ['Lopez', 'Robert', 'Ode to joy', 'Jingle Bells', '', '2'],
    ['Gonzalez', 'Linda', 'Russian folk song', 'Yankee Doodle', '', '2'],
    ['Wilson', 'Barbara', 'Moon on the Water', 'Hungarian Dance', 'Last', '1'],
    ['Anderson', 'Paul', 'River Flows In You', 'Camp town Races', '', '3'],
    ['Thomas', 'Patricia', 'New world symphony', 'Musette', 'Fifth', '2'],
    ['Taylor', 'Christopher', 'ode to joy', 'midnight ride', '', '3'],
    ['Moore', 'Jennifer', 'amazing grace', 'clock tower bells', 'Second', '3'],
    ['Jackson', 'Charles', 'chant of the monks', 'Evelyn Evelyn', '', '1'],
    ['Martin', 'Margaret', 'amazing grace', 'catch a falling star', '', '2'],
]

const container = document.getElementById('hot')
const hot = new Handsontable(container, {
    data: data,
    colHeaders: ['Last', 'First', 'Song 1', 'Song 2', 'Rules', 'Rank'],
    rowHeaders: true,
    contextMenu: true,
    manualRowResize: true,
    manualColumnResize: true,
    columns: [{ data: 0 }, { data: 1 }, { data: 2 }, { data: 3 }, { data: 4 }, { data: 5, type: 'numeric' }],
    licenseKey: 'non-commercial-and-evaluation',
})

function parseTable() {
    return hot.getData()
}

function formatCell(cellText) {
    return cellText
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
}

const parseInput = (input) => {
    const rows = input
        .trim()
        .split('\n')
        .map((row) => row.split('\t'))
        .map((row) => row.map(formatCell))
    const headers = rows.shift()
    return { headers, rows }
}

const formatOutput = ({ headers, rows }) => {
    const formattedRows = rows.map((row) => row.join(',')).join('\n')
    return `${headers.join(',')}\n${formattedRows}`
}

let currentWorkers = []

window.processData = () => {
    const button = document.querySelector('button')
    const progress = document.getElementById('progress')
    const cancelButton = document.getElementById('cancelButton')
    try {
        button.disabled = true
        progress.style.display = 'inline'
        cancelButton.style.display = 'inline'
        progress.value = 0

        const rows = parseTable()
        const headers = ['Last', 'First', 'Song 1', 'Song 2', 'Rules', 'Rank']

        const method = document.getElementById('method').value
        const randomIterations = parseInt(document.getElementById('iterations').value)
        const preventLargeSkillDifference = document.getElementById('preventLargeSkillDifference').checked
        const preventNoSkillDifference = document.getElementById('preventNoSkillDifference').checked

        // Terminate any old workers
        currentWorkers.forEach((worker) => worker.terminate())
        currentWorkers = []

        // Create new workers
        const numCores = navigator.hardwareConcurrency || 4
        const iterationsPerWorker = Math.ceil(randomIterations / numCores)
        console.log({ iterationsPerWorker })
        let iterationsCompleted = 0
        let completedWorkers = 0
        let solutions = []

        function handleWorkerMessage(e) {
            if (e.data.iterations !== undefined) {
                iterationsCompleted += e.data.iterations
                progress.value = iterationsCompleted / randomIterations
            } else {
                solutions.push(e.data.result)
                completedWorkers++

                if (completedWorkers === numCores) {
                    // Find the best solution
                    const best = findBestSolution(solutions.filter(Boolean))

                    if (!best) {
                        alert('No solutions found')
                        button.disabled = false
                        progress.style.display = 'none'
                        cancelButton.style.display = 'none'
                        return
                    }
                    
                    console.log('Best of the best same adjacent:', best.sameAdjacentLevels)
                    const rows = best.solution

                    const output = formatOutput({ headers, rows })

                    const outputTableBody = document.getElementById('outputTable').getElementsByTagName('tbody')[0]
                    outputTableBody.innerHTML = ''

                    rows.forEach((row) => {
                        const tr = document.createElement('tr')
                        row.forEach((cell) => {
                            const td = document.createElement('td')
                            td.textContent = cell
                            tr.appendChild(td)
                        })
                        outputTableBody.appendChild(tr)
                    })

                    button.disabled = false
                    progress.style.display = 'none'
                    cancelButton.style.display = 'none'
                }
            }
        }

        function handleWorkerError(error) {
            alert(error.message)
            button.disabled = false
            progress.style.display = 'none'
            cancelButton.style.display = 'none'
        }

        for (let i = 0; i < numCores; i++) {
            const worker = new Worker('worker.mjs', { type: 'module' })
            worker.onmessage = handleWorkerMessage
            worker.onerror = handleWorkerError

            currentWorkers.push(worker)

            worker.postMessage({
                rows,
                method,
                randomIterations: iterationsPerWorker,
                preventLargeSkillDifference,
                preventNoSkillDifference,
            })
        }
    } catch (error) {
        alert(error)
        button.disabled = false
        progress.style.display = 'none'
        cancelButton.style.display = 'none'
    }
}

window.cancelProcessing = () => {
    currentWorkers.forEach((worker) => worker.terminate())
    currentWorkers = []
    const button = document.querySelector('button')
    const progress = document.getElementById('progress')
    const cancelButton = document.getElementById('cancelButton')
    button.disabled = false
    progress.style.display = 'none'
    cancelButton.style.display = 'none'
}
