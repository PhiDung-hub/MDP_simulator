import BaseAPI, { methodType } from "./BaseAPI";

export default class QueryAPI extends BaseAPI {
  // Query the path from backend server
  static query(obstacles, robotX, robotY, robotDir) {
    const content = {
      obstacles: obstacles,
      robot_x: robotX,
      robot_y: robotY,
      robot_dir: robotDir,
      retrying: false,
    };

    // Send the request to the backend server
    return this.JSONRequest("/path", methodType.post, {}, {}, content)
  }
}
