const stageNames = ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5']

const friday =
    'Blink-182, “Weird Al” Yankovic, Alkaline Trio, Rilo Kiley, Knocked Loose, The Pogues, The Hold Steady, Sparks, Rico Nasty, Senses Fail, Stiff Little Fingers, Shudder To Think, Touché Amoré, Honey Revenge, Camper Van Beethoven, Mariana’s Trench, The Didjits, Agnostic Front, Puddles Pity Party, Julia Wolf, Harrison Gordon, Mac Sabbath, Samiam, The Tossers, Shonen Knife, The Barbarians of California, Big Ass Truck IE, Soviet, Emo Philips'
const saturday =
    'Weezer, Jack White, Sex Pistols, All Time Low, The Beach Boys, Dropkick Murphys, The Front Bottoms, Knuckle Puck, James, The Bouncing Souls, The Damned, Citizen, Free Throw, Panchiko, Buzzcocks, Superchunk, Militarie Gun, The Cribs, Helmet, Marky Ramone Plays The Ramones, Thrown, H2O, Wishy, Violet Vira, Speed of Light, Girl In A Coma, Agent Orange, Cliffdiver'
const sunday =
    'Green Day, IDLES, Jawbreaker, Bad Religion, The Academy Is…, Cobra Starship, Gym Class Heroes, Texas Is The Reason, The Wonder Years, Dance Hall Crashers, Hanson, Inhaler, Screeching Weasel, Microwave, DEHD, The Linda Lindas, Pegboy, The Ataris, Lambrini Girls, Ovlov, Soft Play, Smoking Popes, Delta Sleep, Chase Petra, The Effigies, Zero Boys, The Paradox, Quannnic, Weakened Friends, Dune Rats, Footballhead'

let id = 0

function createTimeGenerator(start = '12:00') {
    const durationMinutes = 30
    const gapMinutes = 5

    let [hours, minutes] = start.split(':').map(Number)

    function formatTime(h, m) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    }

    return function nextTime() {
        let startTime = formatTime(hours, minutes)

        // Calculate end time
        let endHours = hours
        let endMinutes = minutes + durationMinutes
        while (endMinutes >= 60) {
            endMinutes -= 60
            endHours += 1
            if (endHours > 12) endHours -= 12
        }
        let endTime = formatTime(endHours, endMinutes)

        // Update for next call
        hours = endHours
        minutes = endMinutes + gapMinutes // Add gap time
        while (minutes >= 60) {
            minutes -= 60
            hours += 1
            if (hours > 12) hours -= 12
        }

        return { start: startTime, end: endTime }
    }
}

function createStageData(actsString) {
    const data = {}
    const acts = actsString.split(', ')
    const actsPerStage = Math.ceil(acts.length / stageNames.length)

    stageNames.forEach((stage, i) => {
        const timeGenerator = createTimeGenerator()
        const actsForStage = acts.slice(i * actsPerStage, (i + 1) * actsPerStage)

        data[stage] = actsForStage.map((name) => ({
            name,
            id: id++,
            ...timeGenerator(),
        }))
    })

    return data
}

// Split Friday acts between 5 stages as evenly as possible
const fridayActs = friday.split(', ')
const fridayStages = {}
const actsPerStage = Math.ceil(fridayActs.length / stageNames.length)

stageNames.forEach((stage, i) => {
    const timeGenerator = createTimeGenerator()

    const acts = fridayActs.slice(i * actsPerStage, (i + 1) * actsPerStage)
    fridayStages[stage] = acts.map((name) => ({
        name,
        id: id++,
        ...timeGenerator(),
    }))
})

data = {
    // 'Saturday, September 21': {
    //     // ... unchanged
    //     'Cabaret Metro Stage': [
    //         {
    //             name: 'VERBÖTEN',
    //             start: '11:30',
    //             end: '12:00',
    //             id: 32,
    //         },
    //         // ... rest of Saturday data
    //     ],

    'Friday, September 19': createStageData(friday),
    'Saturday, September 21': createStageData(saturday),  
    'Sunday, September 20': createStageData(sunday),
}
