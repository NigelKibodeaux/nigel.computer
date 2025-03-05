export default function findBestSolution(solutions) {
    if (solutions.length === 0) {
        return null
    }

    const best = solutions.reduce(
        (acc, solution) => {
            let sameAdjacentLevels = 0
            for (let i = 1; i < solution.length; i++) {
                if (solution[i][5] === solution[i - 1][5]) {
                    sameAdjacentLevels++

                    if (i > 1 && solution[i][5] === solution[i - 2][5]) {
                        sameAdjacentLevels++
                    }
                }
            }

            if (sameAdjacentLevels < acc.sameAdjacentLevels) {
                acc.sameAdjacentLevels = sameAdjacentLevels
                acc.solution = solution
            }

            return acc
        },
        { sameAdjacentLevels: Infinity, solution: null },
    )

    return best
}
