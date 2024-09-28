import { useEffect, useState, useRef } from "react"
import Arrow, { Direction } from "./Arrow"

const boxSize = 20
const scoreForFood = 100
const speedUpForEvery = 4
const getNearPixel = (value: number) => value - (value % boxSize)
const maxHeight = getNearPixel(document.body.clientHeight) - 100
const maxWidth = getNearPixel(document.body.clientWidth)

type Position = {
    x: number
    y: number
}

const correctPosition = (position: Position) => {
    if (position.y < 0) position.y = maxHeight - boxSize
    if (position.y + boxSize > maxHeight) position.y = 0
    if (position.x + boxSize > maxWidth) position.x = 0
    if (position.x < 0) position.x = maxWidth - boxSize
    return position
}

const initialPosition = {
    x: getNearPixel(maxWidth / 4),
    y: getNearPixel(maxHeight / 2),
}

const validateNewPosition = (boxes: Position[], newPosition: Position) => {
    for (const box of boxes) {
        if (box.x === newPosition.x && box.y === newPosition.y) {
            return false
        }
    }
    return true
}

const getNewRandomPosition = (boxes: Position[]) => {
    const x = getNearPixel(Math.random() * maxWidth)
    const y = getNearPixel(Math.random() * maxHeight)
    const inBody = !validateNewPosition(boxes, { x, y })
    if (inBody) {
        return getNewRandomPosition(boxes)
    }
    return { x, y }
}

const getNextDirection = (buffer: Direction[]) => {
    if (buffer.length <= 1) return buffer[0]
    buffer.shift()
    return buffer[0]
}

export default function App() {
    const boxesRef = useRef<Position[]>([
        correctPosition({
            x: initialPosition.x - 3 * boxSize,
            y: initialPosition.y,
        }),
        correctPosition({
            x: initialPosition.x - 2 * boxSize,
            y: initialPosition.y,
        }),
        correctPosition({
            x: initialPosition.x - boxSize,
            y: initialPosition.y,
        }),
        correctPosition({
            x: initialPosition.x,
            y: initialPosition.y,
        }),
    ])
    const [boxes, setBoxes] = useState(boxesRef.current)
    const [score, setScore] = useState(0)
    const speedUpCounterRef = useRef(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const touchEventRef = useRef<Position>({ x: 0, y: 0 })
    const [speed, setSpeed] = useState(1)
    const directionRef = useRef<Direction[]>([Direction.RIGHT])
    const positionRef = useRef(initialPosition)
    const keyDownRef = useRef<string | null>(null)
    const touchStartRef = useRef<Direction | null>(null)
    const fastForwardTimerRef = useRef<number | null>(null)
    const foodRef = useRef(getNewRandomPosition(boxesRef.current))
    const [gameOver, setGameOver] = useState(false)
    const [food, setFood] = useState(foodRef.current)
    const [highScore, setHighScore] = useState(Number(localStorage.getItem("highScore") ?? "0"))

    const pushDirection = (newDirection: Direction) => {
        const last = directionRef.current[directionRef.current.length - 1]
        if (last === newDirection) {
            return true
        } else {
            if (
                (last === Direction.RIGHT && newDirection !== Direction.LEFT) ||
                (last === Direction.LEFT && newDirection !== Direction.RIGHT) ||
                (last === Direction.UP && newDirection !== Direction.DOWN) ||
                (last === Direction.DOWN && newDirection !== Direction.UP)
            ) {
                directionRef.current.push(newDirection)
            }
        }
        return false
    }

    const movePosition = (direction: Direction) => {
        let temPosition = {
            x: positionRef.current.x,
            y: positionRef.current.y,
        }

        switch (direction) {
            case Direction.UP:
                temPosition.y -= boxSize
                break
            case Direction.DOWN:
                temPosition.y += boxSize
                break
            case Direction.RIGHT:
                temPosition.x += boxSize
                break
            case Direction.LEFT:
                temPosition.x -= boxSize
                break
        }

        temPosition = correctPosition(temPosition)

        const lastRemoved = [...boxesRef.current]
        lastRemoved.shift()

        const isValid = validateNewPosition(lastRemoved, temPosition)
        const ateFood = temPosition.x === foodRef.current.x && temPosition.y === foodRef.current.y
        if (!isValid) {
            setGameOver(true)
        } else if (ateFood) {
            boxesRef.current.push(temPosition)
            const newFoodPosition = getNewRandomPosition(boxesRef.current)
            foodRef.current = newFoodPosition
            setScore((score) => score + scoreForFood)
            setFood(newFoodPosition)

            if (speedUpCounterRef.current > speedUpForEvery) {
                setSpeed((speed) => speed + 0.3)
                speedUpCounterRef.current = 0
            } else {
                speedUpCounterRef.current += 1
            }
        } else {
            boxesRef.current.push(temPosition)
            boxesRef.current.shift()
        }
        setBoxes([...boxesRef.current])

        positionRef.current = temPosition
    }

    const onUp = () => {
        return pushDirection(Direction.UP)
    }

    const onDown = () => {
        return pushDirection(Direction.DOWN)
    }

    const onLeft = () => {
        return pushDirection(Direction.LEFT)
    }

    const onRight = () => {
        return pushDirection(Direction.RIGHT)
    }

    const startFastForward = (direction: Direction) => {
        if (fastForwardTimerRef.current) return
        fastForwardTimerRef.current = setInterval(() => {
            movePosition(direction)
        }, 100)
    }

    const stopFastForward = () => {
        clearInterval(fastForwardTimerRef.current as number)
        fastForwardTimerRef.current = null
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            let same = false
            let direction: Direction = Direction.RIGHT
            switch (event.key) {
                case "ArrowLeft":
                    same = onLeft()
                    direction = Direction.LEFT
                    break
                case "ArrowRight":
                    same = onRight()
                    direction = Direction.RIGHT
                    break
                case "ArrowUp":
                    same = onUp()
                    direction = Direction.UP
                    break
                case "ArrowDown":
                    same = onDown()
                    direction = Direction.DOWN
                    break
            }
            if (same) {
                keyDownRef.current = event.key
                startFastForward(direction)
            } else {
                keyDownRef.current = null
            }
        }

        const handleKeyUp = (event: KeyboardEvent) => {
            if (keyDownRef.current !== null && event.key === keyDownRef.current) {
                stopFastForward()
            }
        }

        const handleTouchStart = (event: TouchEvent) => {
            touchEventRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
        }

        const handleTouchMove = (event: TouchEvent) => {
            const xDown = touchEventRef.current.x
            const yDown = touchEventRef.current.y

            if (!xDown || !yDown) {
                return
            }

            var xUp = event.touches[0].clientX
            var yUp = event.touches[0].clientY

            var xDiff = xDown - xUp
            var yDiff = yDown - yUp

            let same = false
            let direction

            if (Math.abs(xDiff) > Math.abs(yDiff)) {
                /*most significant*/
                if (xDiff > 0) {
                    /* left swipe */
                    same = onLeft()
                    direction = Direction.LEFT
                } else {
                    /* right swipe */
                    same = onRight()
                    direction = Direction.RIGHT
                }
            } else {
                if (yDiff > 0) {
                    /* up swipe */
                    same = onUp()
                    direction = Direction.UP
                } else {
                    /* down swipe */
                    same = onDown()
                    direction = Direction.DOWN
                }
            }
            /* reset values */
            touchEventRef.current = { x: 0, y: 0 }

            if (same) {
                touchStartRef.current = direction
                startFastForward(direction)
            } else {
                touchStartRef.current = null
            }

            event.preventDefault()
        }

        const handleTouchEnd = () => {
            stopFastForward()
        }

        document.addEventListener("keydown", handleKeyDown, false)
        document.addEventListener("keyup", handleKeyUp, false)
        document.addEventListener("touchstart", handleTouchStart, false)
        document.addEventListener("touchmove", handleTouchMove, { passive: false })
        document.addEventListener("touchend", handleTouchEnd, false)

        return () => {
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("keyup", handleKeyUp)
            document.removeEventListener("touchstart", handleTouchStart)
            document.removeEventListener("touchmove", handleTouchMove)
            document.removeEventListener("touchend", handleTouchEnd)
        }
    }, [])

    useEffect(() => {
        if (gameOver) return
        const interval = setInterval(() => {
            const nextDirection = getNextDirection(directionRef.current)
            movePosition(nextDirection)
        }, (1000 / speed) * 0.8)
        return () => {
            clearInterval(interval)
        }
    }, [speed, gameOver])

    useEffect(() => {
        if (score > highScore) {
            setHighScore(score)
            localStorage.setItem("highScore", String(score))
        }
    }, [gameOver])

    const handlePlayAgain = () => {
        boxesRef.current = [
            correctPosition({
                x: initialPosition.x - 3 * boxSize,
                y: initialPosition.y,
            }),
            correctPosition({
                x: initialPosition.x - 2 * boxSize,
                y: initialPosition.y,
            }),
            correctPosition({
                x: initialPosition.x - boxSize,
                y: initialPosition.y,
            }),
            correctPosition({
                x: initialPosition.x,
                y: initialPosition.y,
            }),
        ]
        setBoxes(boxesRef.current)
        setScore(0)
        speedUpCounterRef.current = 0
        setSpeed(1)
        directionRef.current = [Direction.RIGHT]
        positionRef.current = initialPosition
        foodRef.current = getNewRandomPosition(boxesRef.current)
        setGameOver(false)
        setFood(foodRef.current)
    }

    return (
        <div className="App">
            <div className="container" style={{ width: maxWidth, height: maxHeight }} ref={containerRef}>
                {boxes.map((box, id) => (
                    <div
                        key={id}
                        className="box"
                        style={{ top: box.y, left: box.x + (containerRef.current?.offsetLeft ?? 0) }}
                    ></div>
                ))}
                <div
                    className="box food"
                    style={{ top: food.y, left: food.x + (containerRef.current?.offsetLeft ?? 0) }}
                ></div>
                {gameOver && (
                    <div className="game-status">
                        <h1 style={{ color: "red" }}>Game Over</h1>
                        <button onClick={handlePlayAgain}>Play Again</button>
                    </div>
                )}
            </div>
            <div className="dashboard">
                <div className="score">
                    <h2 className="score-item">Score: {score}</h2>
                    <h5 className="score-item">High Score: {highScore}</h5>
                </div>
                <div className="controls">
                    <div className="row">
                        <button onClick={onUp}>
                            <Arrow direction={Direction.UP} />
                        </button>
                    </div>
                    <div className="row">
                        <button onClick={onLeft}>
                            <Arrow direction={Direction.LEFT} />
                        </button>
                        <button onClick={onDown}>
                            <Arrow direction={Direction.DOWN} />
                        </button>
                        <button onClick={onRight}>
                            <Arrow direction={Direction.RIGHT} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
