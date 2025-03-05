import findBestSolution from './findBestSolution.mjs'

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

        const input = document.getElementById('input').value
        const { headers, rows } = parseInput(input)

        if (JSON.stringify(headers) !== JSON.stringify(['Last', 'First', 'Song 1', 'Song 2', 'Rules', 'Rank'])) {
            throw new Error('Invalid headers. Expecting: Last, First, Song 1, Song 2, Rules, Rank')
        }

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
        console.log({iterationsPerWorker})
        let iterationsCompleted = 0
        let completedWorkers = 0
        let solutions = []

        function handleWorkerMessage(e) {
            if (e.data.iterations !== undefined) {
                iterationsCompleted += e.data.iterations
                progress.value = (iterationsCompleted / randomIterations)
            } else {
                solutions.push(e.data.result)
                completedWorkers++

                if (completedWorkers === numCores) {
                    // Find the best solution
                    const best = findBestSolution(solutions)
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
