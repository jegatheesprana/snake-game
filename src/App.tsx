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

const getNextDirection = (buffer: string[]) => {
    if (buffer.length <= 1) return buffer[0]
    buffer.shift()
    return buffer[0]
}

const pushDirection = (directions: string[], newDirection: string) => {
    const last = directions[directions.length - 1]
    if (last !== newDirection) {
        if (
            (last === "right" && newDirection !== "left") ||
            (last === "left" && newDirection !== "right") ||
            (last === "up" && newDirection !== "down") ||
            (last === "down" && newDirection !== "up")
        ) {
            directions.push(newDirection)
        }
    }
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
    const directionRef = useRef<string[]>(["right"])
    const positionRef = useRef(initialPosition)
    const foodRef = useRef(getNewRandomPosition(boxesRef.current))
    const [gameOver, setGameOver] = useState(false)
    const [food, setFood] = useState(foodRef.current)
    const [highScore, setHighScore] = useState(Number(localStorage.getItem("highScore") ?? "0"))

    const onUp = () => {
        pushDirection(directionRef.current, "up")
    }

    const onDown = () => {
        pushDirection(directionRef.current, "down")
    }

    const onLeft = () => {
        pushDirection(directionRef.current, "left")
    }

    const onRight = () => {
        pushDirection(directionRef.current, "right")
    }

    useEffect(() => {
        document.addEventListener(
            "keydown",
            (event) => {
                switch (event.key) {
                    case "ArrowLeft":
                        onLeft()
                        break
                    case "ArrowRight":
                        onRight()
                        break
                    case "ArrowUp":
                        onUp()
                        break
                    case "ArrowDown":
                        onDown()
                        break
                }
            },
            false
        )

        document.addEventListener(
            "touchstart",
            (event) => {
                touchEventRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
            },
            false
        )

        document.addEventListener(
            "touchmove",
            (event) => {
                const xDown = touchEventRef.current.x
                const yDown = touchEventRef.current.y

                if (!xDown || !yDown) {
                    return
                }

                var xUp = event.touches[0].clientX
                var yUp = event.touches[0].clientY

                var xDiff = xDown - xUp
                var yDiff = yDown - yUp

                if (Math.abs(xDiff) > Math.abs(yDiff)) {
                    /*most significant*/
                    if (xDiff > 0) {
                        /* left swipe */
                        onLeft()
                    } else {
                        /* right swipe */
                        onRight()
                    }
                } else {
                    if (yDiff > 0) {
                        /* up swipe */
                        onUp()
                    } else {
                        /* down swipe */
                        onDown()
                    }
                }
                /* reset values */
                touchEventRef.current = { x: 0, y: 0 }
            },
            false
        )
    }, [])

    useEffect(() => {
        if (gameOver) return
        const interval = setInterval(() => {
            let temPosition = {
                x: positionRef.current.x,
                y: positionRef.current.y,
            }

            const nextDirection = getNextDirection(directionRef.current)
            console.log(nextDirection)
            switch (nextDirection) {
                case "up":
                    temPosition.y -= boxSize
                    break
                case "down":
                    temPosition.y += boxSize
                    break
                case "right":
                    temPosition.x += boxSize
                    break
                case "left":
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
        directionRef.current = ["right"]
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
