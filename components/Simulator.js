import React from "react";
import { useState, useEffect, useMemo } from "react";
import QueryAPI from "./QueryAPI";

const Direction = {
  NORTH: 0,
  EAST: 2,
  SOUTH: 4,
  WEST: 6,
  SKIP: 8,
};

const DirectionToString = {
  0: "Up",
  2: "Right",
  4: "Down",
  6: "Left",
  8: "None",
};

const transformCoord = (x, y) => {
  // Change the coordinate system from (0, 0) at top left to (0, 0) at bottom left
  return { x: 19 - y, y: x };
};

export default function Simulator() {
  const [robotState, setRobotState] = useState({
    x: 1,
    y: 1,
    d: Direction.NORTH,
    s: -1,
  });
  const [robotX, setRobotX] = useState(1);
  const [robotY, setRobotY] = useState(1);
  const [robotDir, setRobotDir] = useState(Direction.NORTH);
  const [obstacles, setObstacles] = useState([]);
  const [obXInput, setObXInput] = useState(0);
  const [obYInput, setObYInput] = useState(0);
  const [obDirInput, setObDirInput] = useState(Direction.NORTH);
  const [isComputing, setIsComputing] = useState(false);
  const [path, setPath] = useState([]);
  const [commands, setCommands] = useState([]);
  const [page, setPage] = useState(0);

  const generateNewID = () => {
    while (true) {
      let new_id = Math.floor(Math.random() * 10) + 1; // just try to generate an id;
      let ok = true;
      for (const ob of obstacles) {
        if (ob.id === new_id) {
          ok = false;
          break;
        }
      }
      if (ok) {
        return new_id;
      }
    }
  };

  const generateRobotCells = () => {
    const robotCells = [];
    let markerX = 0;
    let markerY = 0;

    if (Number(robotState.d) === Direction.NORTH) {
      markerY++;
    } else if (Number(robotState.d) === Direction.EAST) {
      markerX++;
    } else if (Number(robotState.d) === Direction.SOUTH) {
      markerY--;
    } else if (Number(robotState.d) === Direction.WEST) {
      markerX--;
    }

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        // Transform the coordinates to our coordinate system where (0, 0) is at the bottom left
        const coord = transformCoord(robotState.x + i, robotState.y + j);
        // If the cell is the marker cell, add the robot state to the cell
        const isMarker = markerX === i && markerY === j;
        robotCells.push({
          x: coord.x,
          y: coord.y,
          d: isMarker ? robotState.d : null,
          s: isMarker ? robotState.s : -1,
        });
      }
    }

    return robotCells;
  };

  const onChangeX = (event) => {
    // If the input is an integer and is in the range [0, 19], set ObXInput to the input
    if (Number.isInteger(Number(event.target.value))) {
      const nb = Number(event.target.value);
      if (0 <= nb && nb < 20) {
        setObXInput(nb);
        return;
      }
    }
    // If the input is not an integer or is not in the range [0, 19], set the input to 0
    setObXInput(0);
  };

  const onChangeY = (event) => {
    // If the input is an integer and is in the range [0, 19], set ObYInput to the input
    if (Number.isInteger(Number(event.target.value))) {
      const nb = Number(event.target.value);
      if (0 <= nb && nb <= 19) {
        setObYInput(nb);
        return;
      }
    }
    // If the input is not an integer or is not in the range [0, 19], set the input to 0
    setObYInput(0);
  };

  const onChangeRobotX = (event) => {
    // If the input is an integer and is in the range [1, 18], set RobotX to the input
    if (Number.isInteger(Number(event.target.value))) {
      const nb = Number(event.target.value);
      if (1 <= nb && nb < 19) {
        setRobotX(nb);
        return;
      }
    }
    // If the input is not an integer or is not in the range [1, 18], set the input to 1
    setRobotX(1);
  };

  const onChangeRobotY = (event) => {
    // If the input is an integer and is in the range [1, 18], set RobotY to the input
    if (Number.isInteger(Number(event.target.value))) {
      const nb = Number(event.target.value);
      if (1 <= nb && nb < 19) {
        setRobotY(nb);
        return;
      }
    }
    // If the input is not an integer or is not in the range [1, 18], set the input to 1
    setRobotY(1);
  };

  const onClickObstacle = () => {
    // If the input is not valid, return
    if (!obXInput && !obYInput) return;
    // Create a new array of obstacles
    const newObstacles = [...obstacles];
    // Add the new obstacle to the array
    newObstacles.push({
      x: obXInput,
      y: obYInput,
      d: obDirInput,
      id: generateNewID(),
    });
    // Set the obstacles to the new array
    setObstacles(newObstacles);
  };

  const onClickRobot = () => {
    // Set the robot state to the input
    setRobotState({ x: robotX, y: robotY, d: robotDir, s: -1 });
  };

  const onDirectionInputChange = (event) => {
    // Set the direction input to the input
    setObDirInput(Number(event.target.value));
  };

  const onRobotDirectionInputChange = (event) => {
    // Set the robot direction to the input
    setRobotDir(Number(event.target.value));
  };

  const onRemoveObstacle = (ob) => {
    // If the path is not empty or the algorithm is computing, return
    if (path.length > 0 || isComputing) return;
    // Create a new array of obstacles
    const newObstacles = [];
    // Add all the obstacles except the one to remove to the new array
    for (const o of obstacles) {
      if (o.x === ob.x && o.y === ob.y) continue;
      newObstacles.push(o);
    }
    // Set the obstacles to the new array
    setObstacles(newObstacles);
  };

  const compute = async () => {
    // Set computing to true, act like a lock
    setIsComputing(true);
    // Call the query function from the API
    const pathPlan = await QueryAPI.query(obstacles, robotX, robotY, robotDir);
    console.log("Path plan", pathPlan);

    if (pathPlan) {
      setPath(pathPlan.path);
      const commands = pathPlan.commands.filter(c => !c.startsWith("SNAP"));
      setCommands(commands);
    }
    // Set computing to false, release the lock
    setIsComputing(false);
  };

  const reset = () => {
    setRobotX(1);
    setRobotDir(0);
    setRobotY(1);
    setRobotState({ x: 1, y: 1, d: Direction.NORTH, s: -1 });
    setPath([]);
    setCommands([]);
    setPage(0);
  }

  const onReset = () => {
    reset();
  };

  const onResetAll = () => {
    // Reset all the states
    reset();
    setObstacles([]);
  };

  const pathCells = useMemo(() => {
    if (path.length == 0) {
      return []
    }
    const cells = [];
    let cur = path[0];
    const arrayRange = (start, stop) =>
      Array.from(
        { length: (stop - start) + 1 },
        (_, index) => start + index
      );

    for (const next of path.slice(1)) {
      const { x: cx, y: cy } = cur;
      const { x: nx, y: ny } = next;

      const xPath = cx > nx ? arrayRange(nx + 1, cx) : arrayRange(cx + 1, nx);
      const yPath = cy > ny ? arrayRange(ny + 1, cy) : arrayRange(cy + 1, ny);

      if (nx != cx) {
        cells.push(...xPath.map(x => transformCoord(x, cy)));
      }
      if (ny != cy) {
        cells.push(...yPath.map(y => transformCoord(nx, y)));
      }
      cur = next
    }
    return cells
  }, [path])

  const renderGrid = () => {
    // Initialize the empty rows array
    const rows = [];

    // Generate robot cells
    const robotCells = generateRobotCells();

    // Generate the grid
    for (let i = 0; i < 20; i++) {
      const cells = [label(i, 19 - i)];

      for (let j = 0; j < 20; j++) {
        const foundOb = obstacles.find((ob) => {
          const { x, y } = transformCoord(ob.x, ob.y);
          return x === i && y == j
        })
        const foundRobotCell = robotCells.find((c) => (c.x === i && c.y === j));
        const isPathCell = pathCells.some(c => (c.x === i && c.y === j))

        if (foundOb) {
          cells.push(obCell(foundOb.d));
        } else if (foundRobotCell) {
          if (foundRobotCell.d !== null) {
            cells.push(
              <td className={`border w-5 h-5 md:w-8 md:h-8 ${foundRobotCell.s != -1 ? "bg-red-500" : "bg-blue-500"}`} />
            );
          } else {
            cells.push(<td className="bg-teal-800 border-white border w-5 h-5 md:w-8 md:h-8" />);
          }
        } else if (isPathCell) {
          cells.push(pathCell());
        } else {
          cells.push(emptyCell());
        }
      }

      rows.push(<tr key={`row-cells-${19 - i}`}>{cells}</tr>);
    }

    const yAxis = [<td key={`yAxis-0`} />];
    for (let i = 0; i < 20; i++) {
      yAxis.push(label(i, i));
    }
    rows.push(<tr key={20}>{yAxis}</tr>);
    return rows;
  };

  useEffect(() => {
    if (page >= path.length) return;
    setRobotState(path[page]);
  }, [page, path]);

  return (
    <div className="flex flex-col items-center justify-center mb-12">
      <div className="flex flex-col items-center text-center mb-8">
        <h2 className="card-title text-black p-4 text-4xl">
          Algorithm Simulator
        </h2>
      </div>

      {path.length > 0 && (
        <div className="flex flex-row items-center text-center bg-sky-200 p-4 rounded-xl shadow-xl my-8">
          <button
            className="btn btn-circle pt-2 pl-1"
            disabled={page === 0}
            onClick={() => {
              setPage(page - 1);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
              />
            </svg>
          </button>

          <span className="mx-5 text-black">
            Step: {page + 1} / {path.length}
          </span>
          <span className="mx-5 text-black">{commands[page]}</span>
          <button
            className="btn btn-circle pt-2 pl-2"
            disabled={page === path.length - 1}
            onClick={() => {
              setPage(page + 1);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </button>
        </div>
      )}

      <table className="border-collapse border-none border-black ">
        <tbody>{renderGrid()}</tbody>
      </table>

      <div className="btn-group btn-group-horizontal py-4">
        <button className="btn btn-error" onClick={onResetAll}>
          Reset All
        </button>
        <button className="btn btn-warning" onClick={onReset}>
          Reset Robot
        </button>
        <button className="btn btn-success" onClick={compute}>
          Calculate Path
        </button>
      </div>

      <div className="flex flex-col items-center text-center rounded-xl">
        <h2 className="card-title text-black">Set Robot Position</h2>
        <div className="form-control">
          <label className="input-group input-group-horizontal">
            <span className="bg-gray-500 p-2 text-gray-200">x</span>
            <input
              onChange={onChangeRobotX}
              type="number"
              placeholder="1"
              min="1"
              max="18"
              defaultValue="1"
              className="input text-gray-900 input-bordered"
            />
            <span className="bg-gray-500 p-2 text-gray-200">y</span>
            <input
              onChange={onChangeRobotY}
              type="number"
              placeholder="1"
              min="1"
              max="18"
              defaultValue="1"
              className="input text-gray-900 input-bordered"
            />
            <span className="bg-gray-500 p-2 text-gray-200">D</span>
            <select
              onChange={onRobotDirectionInputChange}
              value={robotDir}
              className="select text-gray-700 py-2 pl-2 pr-6"
            >
              <option value={Direction.NORTH}>Up</option>
              <option value={Direction.SOUTH}>Down</option>
              <option value={Direction.WEST}>Left</option>
              <option value={Direction.EAST}>Right</option>
            </select>
            <button className="btn btn-warning p-2 w-12" onClick={onClickRobot}>
              Set
            </button>
          </label>
        </div>
      </div>

      <div className="flex flex-col items-center text-center p-4 rounded-xl">
        <h2 className="card-title text-black pb-2">Set Obstacles</h2>
        <div className="form-control">
          <label className="input-group input-group-horizontal">
            <span className="bg-gray-500 p-2 text-gray-200">x</span>
            <input
              onChange={onChangeX}
              type="number"
              placeholder="1"
              min="0"
              max="19"
              className="input input-bordered text-gray-900"
            />
            <span className="bg-gray-500 p-2 text-gray-200">y</span>
            <input
              onChange={onChangeY}
              type="number"
              placeholder="1"
              min="0"
              max="19"
              className="input input-bordered text-gray-900"
            />
            <span className="bg-gray-500 p-2 text-gray-200">D</span>
            <select
              onChange={onDirectionInputChange}
              value={obDirInput}
              className="select text-gray-800 py-2 pl-2 pr-6"
            >
              <option value={Direction.NORTH}>Up</option>
              <option value={Direction.SOUTH}>Down</option>
              <option value={Direction.WEST}>Left</option>
              <option value={Direction.EAST}>Right</option>
              <option value={Direction.SKIP}>None</option>
            </select>
            <button className="btn btn-warning w-12" onClick={onClickObstacle}>
              Set
            </button>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-x-2 gap-y-4 items-center">
        {obstacles.map((ob, id) => {
          return (
            <div
              key={ob}
              className="flex flex-row justify-between !min-w-[5rem] p-2 text-gray-800 bg-sky-100 rounded-md text-xs md:text-sm h-max"
            >
              <div flex flex-col>
                <div>X={ob.x}</div>
                <div>Y={ob.y}</div>
                <div>D={DirectionToString[ob.d]}</div>
              </div>
              <div onClick={() => onRemoveObstacle(ob)} className='flex flex-col self-start'>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-4 h-4 stroke-gray-500 border-2"
                  onClick={() => onRemoveObstacle(ob)}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
                [{id}]
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function obCell(direction) {
  let className = "border w-5 h-5 md:w-8 md:h-8 bg-gray-700";
  switch (direction) {
    case Direction.WEST:
      className += ' border-l-4 border-l-violet-500'
      break;
    case Direction.EAST:
      className += ' border-r-4 border-r-violet-500'
      break;
    case Direction.NORTH:
      className += ' border-t-4 border-t-violet-500'
      break;
    case Direction.SOUTH:
      className += ' border-b-4 border-b-violet-500'
      break;
  }
  return (
    <td className={className} />
  )
}


function emptyCell() {
  return (
    <td className="border-black border w-5 h-5 md:w-8 md:h-8" />
  )
}

function pathCell() {
  return (
    <td className="border-black bg-gray-300 border w-5 h-5 md:w-8 md:h-8" />
  )
}

function label(key, value) {
  return (
    <td key={key} className="w-5 h-5 md:w-8 md:h-8 text-black font-bold text-[0.6rem] md:text-base ">
      {value}
    </td>
  )
}
