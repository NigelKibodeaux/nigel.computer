self.onmessage = function (e) {
    const { rows, method, randomIterations, preventLargeSkillDifference, preventNoSkillDifference } = e.data;

    const orderRows = (rows, method, randomIterations, preventLargeSkillDifference, preventNoSkillDifference) => {
        const orderRules = {
            First: 0,
            Second: 1,
            Third: 2,
            Fourth: 3,
            Fifth: 4,
            Sixth: 5,
            Seventh: 6,
            Eighth: 7,
            Ninth: 8,
            Tenth: 9,
            Eleventh: 10,
            Twelfth: 11,
            Thirteenth: 12,
            Fourteenth: 13,
            Fifteenth: 14,
            Sixteenth: 15,
            Seventeenth: 16,
            Eighteenth: 17,
            Nineteenth: 18,
            Twentieth: 19,
            '2nd To Last': rows.length - 2,
            Last: rows.length - 1,
        };

        const orderedRows = Array(rows.length).fill(null);
        const remainingRows = [];

        function checkOrderedRows() {
            for (const [index, row] of orderedRows.entries()) {
                if (!isValidPlacement(row, index)) {
                    return false;
                }
            }
            return true;
        }

        rows.forEach((row) => {
            const orderRule = row[4].trim();
            if (!orderRule) {
                remainingRows.push(row);
                return;
            }

            if (orderRules.hasOwnProperty(orderRule)) {
                orderedRows[orderRules[orderRule]] = row;
            } else {
                throw new Error(`Invalid order rule: ${orderRule}`);
            }
        });

        function isValidPlacement(row, index) {
            if (row[4] !== '') {
                return orderRules[row[4]] === index;
            }

            const prevRow = orderedRows[index - 1];
            const nextRow = orderedRows[index + 1];

            if (prevRow) {
                const sharesSongsWithPrevRow =
                    row[2] === prevRow[2] ||
                    row[3] === prevRow[3] ||
                    row[2] === prevRow[3] ||
                    row[3] === prevRow[2];

                if (sharesSongsWithPrevRow) return false;

                const largeSkillDifference = Math.abs(prevRow[5] - row[5]) > 1;

                if (preventLargeSkillDifference && largeSkillDifference) return false;

                const noSkillDifference = Math.abs(prevRow[5] - row[5]) === 0;
                if (preventNoSkillDifference && noSkillDifference) return false;
            }

            if (nextRow) {
                const sharesSongsWithNextRow =
                    row[2] === nextRow[2] ||
                    row[3] === nextRow[3] ||
                    row[2] === nextRow[3] ||
                    row[3] === nextRow[2];

                if (sharesSongsWithNextRow) return false;

                const largeSkillDifference = Math.abs(nextRow[5] - row[5]) > 1;
                if (preventLargeSkillDifference && largeSkillDifference) return false;

                const noSkillDifference = Math.abs(nextRow[5] - row[5]) === 0;
                if (preventNoSkillDifference && noSkillDifference) return false;
            }

            return true;
        }

        if (method === 'procedural') {
            for (const [i, row] of orderedRows.entries()) {
                if (!row) {
                    for (const [j, remainingRow] of remainingRows.entries()) {
                        if (isValidPlacement(remainingRow, i)) {
                            orderedRows[i] = remainingRows.splice(j, 1)[0];
                            break;
                        }
                    }
                }
            }

            if (remainingRows.length > 0) {
                for (const [index, row] of orderedRows.entries()) {
                    if (!row && remainingRows.length > 0) {
                        orderedRows[index] = remainingRows.shift();
                    }
                }
            }

            if (remainingRows.length > 0) {
                console.warn('Some rows could not be placed:', remainingRows);
            }
        } else if (method === 'random') {
            let iterations = 1;
            const remainingIndexes = Array.from({ length: orderedRows.length }, (_, i) => i).filter(
                (i) => !orderedRows[i],
            );

            const solutions = [];
            do {
                if (iterations % 10_000 === 0) console.log('Iteration:', iterations);

                shuffleArray(remainingIndexes);

                for (const [i, index] of remainingIndexes.entries()) {
                    orderedRows[index] = remainingRows[i];
                }

                if (
                    checkOrderedRows() &&
                    !solutions.some((solution) => solution.every((row, i) => row === orderedRows[i]))
                ) {
                    solutions.push(orderedRows.slice());
                }
            } while (iterations++ < randomIterations);

            console.log('Solutions:', solutions.length);

            const bestSolution = solutions.reduce(
                (acc, solution) => {
                    let sameAdjacentLevels = 0;
                    for (let i = 1; i < solution.length; i++) {
                        if (solution[i][5] === solution[i - 1][5]) {
                            sameAdjacentLevels++;

                            if (i > 1 && solution[i][5] === solution[i - 2][5]) {
                                sameAdjacentLevels++;
                            }
                        }
                    }

                    if (sameAdjacentLevels < acc.sameAdjacentLevels) {
                        acc.sameAdjacentLevels = sameAdjacentLevels;
                        acc.solution = solution;
                    }

                    return acc;
                },
                { sameAdjacentLevels: Infinity, solution: null },
            );

            console.log('Lowest number of adjacent levels:', bestSolution.sameAdjacentLevels);

            return bestSolution.solution;
        } else if (method === 'permutations') {
            const start = new Date();
            const remainingIndexes = Array.from({ length: orderedRows.length }, (_, i) => i).filter(
                (i) => !orderedRows[i],
            );

            const totalPermutations = remainingIndexes.reduce((acc, _, i) => acc * (i + 1), 1);
            console.log('Total permutations to evaluate:', totalPermutations.toLocaleString());

            const permutations = getPermutations(shuffleArray(remainingIndexes));

            const successful_permutations = [];
            let permutation_counter = 0;
            for (const permutation of permutations) {
                permutation_counter++;
                if (permutation_counter % 10_000_000 === 0) {
                    console.log('Permutations so far:', permutation_counter.toLocaleString());
                    console.log(
                        'Percentage:',
                        ((permutation_counter / totalPermutations) * 100).toFixed(2) + '%',
                    );
                    console.log(
                        'Time remaining (hours):',
                        (((new Date() - start) / permutation_counter) *
                            (totalPermutations - permutation_counter)) /
                            3600000,
                    );
                    console.log(permutation.join(', '));
                    console.log('Successful permutations:', successful_permutations.length.toLocaleString());
                    console.table(successful_permutations.at(-1));
                }
            }
            console.log('Total permutations:', permutation_counter.toLocaleString());

            return successful_permutations;
        }

        const success = checkOrderedRows();
        if (!success) {
            console.error('Failed to order rows');
        }

        return orderedRows;
    };

    const result = orderRows(rows, method, randomIterations, preventLargeSkillDifference, preventNoSkillDifference);
    self.postMessage(result);
};

function* getPermutations(arr, n = arr.length) {
    if (n === 1) {
        yield arr.slice();
    } else {
        for (let i = 0; i < n; i++) {
            yield* getPermutations(arr, n - 1);
            const swapIndex = n % 2 === 0 ? i : 0;
            [arr[swapIndex], arr[n - 1]] = [arr[n - 1], arr[swapIndex]]; // Swap
        }
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}