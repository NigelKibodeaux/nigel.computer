const chosenEvents = getMyEventsFromUrl(window.location.href)

// Get friend events from the query string
const friendEvents = []
const url = new URL(window.location.href)
const friendEventsFromQuery = url.searchParams.get('friend')
if (friendEventsFromQuery) {
    friendEventsFromQuery
        .split('.')
        .filter(Boolean)
        .forEach((x) => friendEvents.push(x))
}

const scheduleContainer = document.getElementById('schedule')

const minute_height = 2 // pixels per minute
const increment = 0.25 // 15 minutes per horizontal line

// Error if there are duplicate event IDs
const eventIds = new Set()
Object.values(data).forEach((stages) => {
    Object.values(stages).forEach((events) => {
        events.forEach((event) => {
            if (eventIds.has(event.id)) {
                alert(`Duplicate event ID: ${event.id}`)
                throw new Error(`Duplicate event ID: ${event.id}`)
            } else {
                eventIds.add(event.id)
            }
        })
    })
})

function calculateStartAndEndMinutes(event) {
    let startHours = parseInt(event.start.split(':')[0])
    if (startHours < 11) startHours += 12
    let endHours = parseInt(event.end.split(':')[0])
    if (endHours < 11) endHours += 12

    const startMinutes = startHours * 60 + parseInt(event.start.split(':')[1])
    const endMinutes = endHours * 60 + parseInt(event.end.split(':')[1])

    return { startMinutes, endMinutes }
}

Object.entries(data).forEach(([day, stages]) => {
    const heading = document.createElement('h2')
    heading.textContent = day
    scheduleContainer.appendChild(heading)

    const dayContainer = document.createElement('div')
    dayContainer.classList.add('day')

    const stageContainer = document.createElement('table')
    stageContainer.classList.add('stage-container')

    // colgroups to set width
    const colgroup = document.createElement('colgroup')
    const timeCol = document.createElement('col')
    timeCol.style.width = `${32}px`
    colgroup.appendChild(timeCol)
    Object.entries(stages).forEach(([stage, events]) => {
        if (stage !== 'day') {
            const col = document.createElement('col')
            col.style.width = `${20}%`
            colgroup.appendChild(col)
        }
    })
    stageContainer.appendChild(colgroup)

    // header row
    const thead = document.createElement('thead')
    const hr = document.createElement('tr')
    thead.appendChild(hr)
    const blank_th = document.createElement('th')
    hr.appendChild(blank_th)
    stageContainer.appendChild(thead)
    Object.entries(stages).forEach(([stage, events]) => {
        if (stage !== 'day') {
            const th = document.createElement('th')
            th.innerHTML = stage
            hr.appendChild(th)
        }
    })

    const row = document.createElement('tr')
    stageContainer.appendChild(row)

    const timeColumn = document.createElement('div')
    timeColumn.classList.add('time-column')
    timeColumn.style.position = 'absolute'
    timeColumn.style.width = '100%'
    timeColumn.style.marginTop = '50px'

    // Calculate where the day starts and ends
    let day_start_time
    let day_end_time
    for (const [stage, events] of Object.entries(stages)) {
        for (const event of events) {
            const { startMinutes, endMinutes } = calculateStartAndEndMinutes(event)
            if (!day_start_time || startMinutes < day_start_time * 60) {
                day_start_time = startMinutes / 60
            }
            if (!day_end_time || endMinutes > day_end_time * 60) {
                day_end_time = endMinutes / 60
            }
        }
    }

    // Round start time (in decimal hours) down to the neareest quarter hour
    day_start_time = Math.floor(day_start_time * 4) / 4
    // Round end time up to the nearest quarter hour
    day_end_time = Math.ceil(day_end_time * 4) / 4

    // Create time slots
    for (let i = day_start_time; i <= day_end_time; i = i + increment) {
        const timeSlot = document.createElement('div')
        const hour = parseInt(i) <= 12 ? parseInt(i) : parseInt(i) - 12
        const minutes = 60 * (i % 1)
        timeSlot.textContent = `${hour}:${Math.round(minutes).toString().padStart(2, "0")}`
        timeSlot.style.top = `${i * 60 * minute_height}px`
        timeSlot.style.height = `${60 * increment * minute_height}px`
        timeColumn.appendChild(timeSlot)
    }
    dayContainer.appendChild(timeColumn)

    // clone the time column and append it to the row to set the height
    const timeColumnClone = timeColumn.cloneNode(true)
    timeColumnClone.style.position = ''
    timeColumnClone.style.width = '32px'
    timeColumnClone.style.marginTop = '0'
    const td = document.createElement('td')
    td.classList.add('time-cell')
    td.appendChild(timeColumnClone)
    row.appendChild(td)

    Object.entries(stages).forEach(([stage, events]) => {
        if (stage !== 'day') {
            const stageElement = document.createElement('td')
            // stageElement.classList.add('stage')
            // stageElement.innerHTML = `<h3>${stage.split(' ').map(x => `<span>${x}</span>`).join(' ')}</h3>`;

            const eventsContainer = document.createElement('div')
            eventsContainer.classList.add('eventsContainer')

            events.forEach((event) => {
                try {
                    const eventElement = document.createElement('div')
                    eventElement.classList.add('event')

                    const { startMinutes, endMinutes } = calculateStartAndEndMinutes(event)
                    eventElement.style.top = `${(startMinutes - day_start_time * 60) * minute_height}px`
                    eventElement.style.height = `${(endMinutes - startMinutes) * minute_height}px`
                    if (chosenEvents.includes(event.id)) {
                        eventElement.classList.add('chosen')
                    }
                    if (friendEvents.includes(event.id)) {
                        eventElement.classList.add('friend')
                    }
                    eventElement.innerHTML = event.name.toLowerCase() + '<br>' + event.start + ' - ' + event.end

                    if (event.album) {
                        eventElement.innerHTML += '<br>Album Play: ' + event.album
                    }

                    eventsContainer.appendChild(eventElement)

                    // when you click on an event, it will turn red
                    eventElement.addEventListener('click', () => {
                        const urlParams = new URLSearchParams(window.location.search)
                        const chosenEvents = new Set((urlParams.get('mine') || '').split('.').filter(Boolean))

                        if (eventElement.classList.contains('chosen')) {
                            eventElement.classList.remove('chosen')
                            chosenEvents.delete(event.id)
                        } else {
                            eventElement.classList.add('chosen')
                            chosenEvents.add(event.id)
                        }

                        if (chosenEvents.size > 0) {
                            urlParams.set('mine', Array.from(chosenEvents).join('.'))
                        } else {
                            urlParams.delete('mine')
                        }
                        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)
                    })
                } catch (e) {
                    console.log(day)
                    console.log(stage)
                    console.log(event)
                    console.log(e)
                }
            })

            stageElement.appendChild(eventsContainer)
            row.appendChild(stageElement)
        }
    })

    dayContainer.appendChild(stageContainer)
    scheduleContainer.appendChild(dayContainer)
})

async function copy(event, button) {
    event.preventDefault()

    try {
        // Make sure they have picks
        const chosenEvents = getMyEventsFromUrl(document.location.href)
        if (chosenEvents.length === 0) {
            const originalText = button.textContent
            button.textContent = 'Select some shows first!'
            setTimeout(() => {
                button.textContent = originalText
            }, 2000)
            return
        }

        // Make a friend link out of "my" events
        const currentUrl = new URL(document.location.href)
        currentUrl.searchParams.set('friend', currentUrl.searchParams.get('mine'))
        currentUrl.searchParams.delete('mine')
        const linkForFriend = currentUrl.toString()

        // Modern clipboard API
        await navigator.clipboard.writeText(linkForFriend)

        const originalText = button.textContent
        button.textContent = 'Link Copied!'
        setTimeout(() => {
            button.textContent = originalText
        }, 2000)

    } catch (err) {
        console.error('Failed to copy the link: ', err)
        
        // Fallback to the old method if clipboard API fails
        try {
            const el = document.createElement('textarea')
            el.value = linkForFriend
            document.body.appendChild(el)
            el.select()
            const successful = document.execCommand('copy')
            document.body.removeChild(el)
            
            if (successful) {
                const originalText = button.textContent
                button.textContent = 'Link Copied!'
                setTimeout(() => {
                    button.textContent = originalText
                }, 2000)
            } else {
                throw new Error('Copy command was unsuccessful')
            }
        } catch (fallbackErr) {
            console.error('Fallback copy also failed: ', fallbackErr)
            alert('Failed to copy the link but you can manually copy it from the address bar')
        }
    }
}

function friendImport() {
    try {
        const importInput = document.getElementById('import')
        const friendUrl = importInput.value.trim()

        // Validate the URL
        if (!friendUrl) {
            alert('Please enter a valid URL.')
            return
        }

        // Check if the URL is valid
        new URL(friendUrl) // This will throw an error if the URL is invalid

        // Get friend's events from the URL
        const friendEvents = getFriendEventsFromUrl(friendUrl)

        if (friendEvents.length === 0) {
            alert('No events found in the provided link.')
            return
        }

        const myEvents = getMyEventsFromUrl(document.location.href)
        const urlParams = new URLSearchParams(window.location.search)

        if (friendEvents.length > 0) {
            urlParams.set('friend', Array.from(friendEvents).join('.'))
        } else {
            urlParams.delete('friend')
        }

        if (myEvents.length > 0) {
            urlParams.set('mine', Array.from(myEvents).join('.'))
        } else {
            urlParams.delete('mine')
        }

        // Reload the page with the friend's events in the URL
        window.location.search = urlParams
    } catch (error) {
        console.error('Invalid URL:', error)
        alert('Please enter a valid URL.')
    }
}

function getFriendEventsFromUrl(url_string) {
    const friendEvents = []
    const url_object = new URL(url_string)

    // If there is a "friend" parameter and no "mine", they are sharing a link created by the copy button
    if (url_object.searchParams.has('friend') && !url_object.searchParams.has('mine')) {
        // Switch "friend" to "mine"
        const friendEventsFromQuery = url_object.searchParams.get('friend')
        if (friendEventsFromQuery) {
            url_object.searchParams.set('mine', friendEventsFromQuery)
        }
    }

    return getMyEventsFromUrl(url_object.toString())
}

function getMyEventsFromUrl(url_string) {
    const chosenEvents = []
    const url_object = new URL(url_string)

    // Get chosen events from the query string
    const chosenEventsFromQuery = url_object.searchParams.get('mine')
    if (chosenEventsFromQuery) {
        chosenEventsFromQuery
            .split('.')
            .filter(Boolean)
            .forEach((x) => chosenEvents.push(x))
    }

    return chosenEvents
}
