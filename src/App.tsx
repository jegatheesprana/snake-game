import { useEffect, useState, useRef } from "react"
import Arrow, { Direction } from "./Arrow"

const boxSize = 20
const scoreIncrement = 2
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
    const [speed, setSpeed] = useState(1)
    const directionRef = useRef("right")
    const positionRef = useRef(initialPosition)
    const foodRef = useRef(getNewRandomPosition(boxesRef.current))
    const [gameOver, setGameOver] = useState(false)
    const [food, setFood] = useState(foodRef.current)
    const [highScore, setHighScore] = useState(Number(localStorage.getItem("highScore") ?? "0"))

    const onUp = () => {
        directionRef.current = "up"
    }

    const onDown = () => {
        directionRef.current = "down"
    }

    const onLeft = () => {
        directionRef.current = "left"
    }

    const onRight = () => {
        directionRef.current = "right"
    }

    useEffect(() => {
        document.addEventListener("keydown", (event) => {
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
        })
    }, [])

    useEffect(() => {
        if (gameOver) return
        const interval = setInterval(() => {
            let temPosition = {
                x: positionRef.current.x,
                y: positionRef.current.y,
            }

            switch (directionRef.current) {
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
        }, 1000 / speed)
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
        directionRef.current = "right"
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
