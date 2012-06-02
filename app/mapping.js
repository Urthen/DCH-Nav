var nodes = require("../assets/graph"),
	graph = {},
	floors = [];

function calcDist(a, b) {
	x = a.pos[0] - b.pos[0]
	y = a.pos[1] - b.pos[1]
	return x * x + y * y
}

for (var floor in nodes.floors) {
	floor = parseInt(floor);
	floors[floor] = nodes.floors[floor] //I am floored by this code
}

for (var endpoint in nodes.endpoints) {
	var node = nodes.endpoints[endpoint];
	graph[endpoint] = {
		"id": endpoint,
		"name": node.name,
		"pos": node.pos,
		"type": "endpoint",
		"connections": {}
	};
}

for (var junction in nodes.junctions) {
	var node = nodes.junctions[junction];
	graph[junction] = {
		"id": junction,
		"name": junction,
		"pos": node.pos,
		"type": "junction",
		"connections": {}
	}
	for (var name in node.connections) {
		var endpoint = graph[name],
			dist = calcDist(node, endpoint);
		graph[junction].connections[name] = {
			"desc": node.connections[name][0],
			"dist": dist
		}
		endpoint.connections[junction] = {
			"desc": node.connections[name][1],
			"dist": dist
		}
	}
}

for (var elevator in nodes.elevators) {
	var node = nodes.elevators[elevator];
	graph[elevator] = {
		"id": elevator,
		"name": node.name,
		"pos": node.pos,
		"type": "elevator",
		"connections": {}
	}
	for (var i in node.exits) {
		var exit = node.exits[i],
			junction = graph[exit];
		graph[elevator].connections[exit] = {
			"desc": "Exit the elevator at the " + floors[i].description,
			"dist": calcDist(graph[elevator], junction) + 0.5
		}
		junction.connections[elevator] = {
			"desc": "Enter the " + node.name,
			"dist": calcDist(graph[elevator], junction) + 0.5
		}
	}
}

function addToPath(path, name, connection) {
	var newRoute = path.route.slice(0),
		newTbt = path.tbt.slice(0);
	
	for (var waypoint in path.route) {
		if (path.route[waypoint].id == name) {
			return
		}
	}

	newRoute.push(graph[name]);
	newTbt.push(connection.desc);

	return {
		'dist': path.dist + connection.dist,
		'route': newRoute,
		'tbt': newTbt
	};
}

function extendPath(path) {
	var newPaths = [],
		tip = path.route[path.route.length - 1],
		connection;
	for (var name in tip.connections) {
		connection = tip.connections[name]
		var newPath = addToPath(path, name, connection)
		if (newPath) {
			newPaths.push(addToPath(path, name, connection))
		}
	}
	return newPaths;
}

function addMorePaths(paths, to) {
	var newPaths = [],
		added;
	for (var path in paths) {
		added = extendPath(paths[path]);
		if (added && added.length) {
			for (var plus in added) {
				newPaths.push(added[plus]);
			}
		}
	}
	return newPaths;
}

function getRoute (from, to) {
	var paths = [
			{
				'dist': 0,
				'route': [from],
				'tbt': []
			}
		],
		bestPath;

	while (!bestPath && paths.length) {
		paths = addMorePaths(paths, to);
		for (var p in paths) {
			var path = paths[p]
			if (path.route[path.route.length - 1] == to) {
				if (bestPath) {
					if (path.dist < bestPath.dist) {
						bestPath = path
					}
				} else {
					bestPath = path
				}
			} 
		}
	}
	console.log("Paths", paths)
	return bestPath;
}

exports.graph = graph;
exports.floors = floors;
exports.getRoute = getRoute;
