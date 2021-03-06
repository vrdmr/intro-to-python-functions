---
title: Introduction to Azure Functions (Python)
date: 2022-04-07
draft: false
---

class: center, middle

# Azure Functions

## Introduction to Python Functions

![:scale 15%](img/FunctionApps.png)<img src="img/Heart.png" width="20"> ![:scale 15%](img/logo_python.png)

Shreya Batra · <shreya.batra@microsoft.com> <br>
Varad Meru · <varad.meru@microsoft.com>

---

# Agenda

- Who are we?
- Basics
  - Folder Structure and Programming Model
- Architecture
  - Infrastructure overview
  - Functions Host, Python worker and gRPC interface
- Best Practices for Performance
  - `sync` vs `async`
  - `ThreadpoolExecutor` for `sync` functions
  - Performance app settings - `PYTHON_THREADPOOL_THREAD_COUNT` and `FUNCTIONS_WORKER_PROCESS_COUNT`
- Other Dev Features (Current and upcoming)
  - Durable Functions 
  - Python Functions Extensions
  - Debug logging
  - Dependency Isolation
  - WSGI and ASGI integration
  - Sneak peek
    - PyStein: New Programming Model for Python Functions

---

# Who are we?

<br/>
<br/>
- Varad Meru
  - Senior SWE Engg. Manager @ Azure Functions - Python
  - Working on Python Functions for past 2 years.


<br/>
<br/>
- Shreya Batra
  - Program Manager @ Azure Functions - Python.
  - Working on Python Functions for past 6 months.

---

# Basics

![:scale 100%](img/abc.png)

---

# Folder Structure

```
<project_root>/
 | - .venv/
 | - .vscode/
 | - my_first_function/
 | | - __init__.py
 | | - function.json
 | | - example.py
 | - my_second_function/
 | | - __init__.py
 | | - function.json
 | - shared_code/
 | | - __init__.py
 | | - my_first_helper_function.py
 | | - my_second_helper_function.py
 | - tests/
 | | - test_my_second_function.py
 | - .funcignore
 | - host.json
 | - local.settings.json
 | - requirements.txt
 | - Dockerfile
```

---

## Folder Structure II

File | Details
---|---
local.settings.json | Contains app settings and connection strings when running locally.
requirements.txt | Includes Python packages for publishing to Azure.
host.json | Contains function app level configuration details.
.vscode/ | (Optional) Contains VSCode configuration.
.venv/ | (Optional) Contains Python virtual environment for local development
Dockerfile | (Optional) Used for phlising project in a customer container.
tests/ | (Optional) Contains test cases for function app.
.funcignore | (Optional) Declares files that should not be published to Azure.

---

# Programming Model

- The method should be implemented as a global method called main() in the file _init_.py.
- Triggers and bindings are indicated in the function.json file.
- Attributes and return tpes can also be declared in the Function using Python type annotations.

---

## `main` function

The "main" method is located in the file _init_.py and defines the actions of the fucntion. 

```python
import azure.functions as func

def main(req: func.HttpRequest, msg: func.Out[str]) -> func.HttpResponse:
    input_msg = req.params.get('message')
    msg.set(input_msg)
    logging.info("Food order has been successfully processed and placed in the queue.")
    return 'Order has been successfully processed and placed in the queue.'
```

---

## function.json

The function.json file is where triggers and bindings are established.

A trigger is what causes the function to run.
A binding can be leveraged for input or output.

Here is an example of a queue output binding represented in function.json:

```json
{
      "type": "queue",
      "direction": "out",
      "name": "msg",
      "queueName": "kitchen-queue",
      "connection": "AzureQueueConnectionString"
}
```

---

## Alternate Entry Point

Specify scriptFile and entryPoint in the function.json file to use an alternate entry point for the function.

```json

{
  "scriptFile": "main.py",
  "entryPoint": "customentry",
  "bindings": [
      ...
  ]
}
```

---

# Sample Function App in Action

Scenario: A restaurant that needs to process food requests in the same order they recieved them, and store the data for later analysis.

Workflow:

- Food request is sent to the queue
- The kitchen processes the food request from the queue
- The order details are placed in a database

Function #1: CustomerToKitchen
<br/>
HTTP request (CustomerOrder) -> Queue (kitchen-queue)

Function #2: RecordOrderData
<br/>
Queue (kitchen-queue) -> CosmosDB (OrderHistory)

---

# Infrastructure Overview

#### Infrastructure 

![:scale 80%](img/image%205.png)

---

# Functions Overview

![:scale 100%](img/image%203.png)

---

# Worker Architecture

Core building blocks of the worker:

```
              +-----------------+
              |     WebHost     |
              +-----------------+
                       ^
                       | gRPC messages
  ---------------------+-------------------------------
   Python Worker       |
                       v
             +------------------+          +----------+
       +-----|    Dispatcher    <----------> Bindings |
       |     +------------------+          +----------+
       |                                +-------+
       |                           +----| func1 |
       |                           |    +-------+
  +----v---------------+           |
  |      Functions     |           |    +-------+
  |      Registry      | <---------+----| func2 |
  +--------------------+           |    +-------+
                                   |       ...
                                   |    +-------+
                                   +----| funcN |
                                        +-------+
```

---

# Worker Architecture II

Functions Loading

![:scale 100%](img/image.png)

---

# Worker Architecture III

Functions Invocations

![:scale 90%](img/image%202.png)

---

# Best Practices for Performance

![wheels-moving-together](img/moving-gears-animation.gif)

---

# Sync vs. Async

More information at [Improve Throughput Performance](https://docs.microsoft.com/azure/azure-functions/python-scale-performance-reference)

- `sync` methods - host instance for Python can process only one function invocation at a time.

```python
# Runs in an ThreadPoolExecutor threadpool. Number of threads is defined by PYTHON_THREADPOOL_THREAD_COUNT. 
# The example is intended to show how default synchronous function are handled.

def main():
    some_blocking_socket_io()
```

- `async` methods - can improve the performance for a function app that processes many I/O events or is I/O bound


```python
import aiohttp

import azure.functions as func

async def main(req: func.HttpRequest) -> func.HttpResponse:
    async with aiohttp.ClientSession() as client:
        async with client.get("PUT_YOUR_URL_HERE") as response:
            return func.HttpResponse(await response.text())

    return func.HttpResponse(body='NotFound', status_code=404)
```

---

## Performance AppSettings

More information at [Improve Throughput Performance](https://docs.microsoft.com/azure/azure-functions/python-scale-performance-reference)

`PYTHON_THREADPOOL_THREAD_COUNT`: ThreadPoolExecutor for `sync` functions
<br/>

![:scale 90%](img/image%202.png)

---

## Performance AppSettings II

`FUNCTIONS_WORKER_PROCESS_COUNT`:

<br/>

![:scale 80%](img/image%203.png)

---

# Current & Upcoming Features

<!-- ![:scale 70%, :align center](img/buildinginprogress.gif) -->
<p align="center">
<img width="500" height="500" src="img/buildinginprogress.gif">
</p>

---

# Debug Logging

#### In Preview

- **Allow debug logging through app setting** - Configuring `PYTHON_ENABLE_DEBUG_LOGGING` to 1 in app settings
- Used to enable/disable debug logging with easy and no-redeployment of your application.

---

# Dependency Isolation

#### In Preview

- **Prevent customer and worker library collision** - Configuring `PYTHON_ISOLATE_WORKER_DEPENDENCIES` to 1 in app settings
- Used to prevent your application from referring worker's dependencies, and vice-versa.
- Example libraries: protobuf

---

# Python Functions Extensions

Application-level Python worker [extensions](https://docs.microsoft.com/en-us/azure/azure-functions/develop-python-worker-extensions?tabs=windows%2Cpypi) enable customers to add pre and post invocation logic to their function apps.

The [OpenCensus Python Extensions](https://github.com/census-ecosystem/opencensus-python-extensions-azure/blob/main/extensions/functions/README.rst) can be leveraged to collect custom request and custom dependecy telemetry outside of bindings.

---

# WSGI and ASGI Integration

<br/>
<br/>
You can leverage WSGI and ASGI-compatible frameworks such as Flask and FastAPI with your HTTP-triggered Python functions.
<br/>
<br/>
This can be helpful if you are familiar with a particular framework, or if you have existing code you would like to reuse to create the Function app.


---

# ASGI

Complete working sample: [ASGI Sample](https://docs.microsoft.com/en-us/samples/azure-samples/fastapi-on-azure-functions/azure-functions-python-create-fastapi-app/)

```python
app=fastapi.FastAPI()

@app.get("hello/{name}")
async def get_name(
  name: str,):
  return {
      "name": name,}

def main(req: func.HttpRequest, context: func.Context) -> func.HttpResponse:
    return AsgiMiddleware(app).handle(req, context)
```

Additionally, `function.json` should be updated to include 'route' in the HTTP trigger and 'host.json' should be updated to include an HTTP 'routePrefix'.

---

# WSGI

Complete working sample: [WSGI Sample](https://docs.microsoft.com/en-us/samples/azure-samples/flask-app-on-azure-functions/azure-functions-python-create-flask-app/)

```python
app=Flask("Test")

@app.route("hello/<name>", methods=['GET'])
def hello(name: str):
    return f"hello {name}"

def main(req: func.HttpRequest, context) -> func.HttpResponse:
  logging.info('Python HTTP trigger function processed a request.')
  return func.WsgiMiddleware(app).handle(req, context)
```

Additionally, `function.json` should be updated to include 'route' in the HTTP trigger and 'host.json' should be updated to include an HTTP 'routePrefix'.

---

# Sneak Peak: New Programming Model

![:scale 60%](img/stein.jpg)

---

# Motivation

Customers told us that current programming model is at times not idiomatic for Python developers.

- “So I’m confused about where exactly am I to put my code….” – When trying to figure out where is the entry point"
- "I wasn’t sure what exactly I’m running….I’m slightly confused about the project, the trigger and the code I was given to run” – After pressing F5 and seeing logs printed out on the terminal"

We decided we want to meet developers where they are at and improve the Function creation experience.

---

# Key Differences

1. Functions will be in a single .py file - `function_app.py`
2. Triggers and bindings will be Python decoraters, similar to well-known Python libraries (Flask, FastAPI, et. al.)
3. No `function.json` file

---

# Sample Function

**Before and After: HTTP**

![:scale 100%](img/http-trigger.png)

---

# Sample Function 

**Before and After: Queue**

![:scale 100%](img/queue.png)

---

class: center, middle

# Questions?

---

class: center, middle

<iframe src="https://giphy.com/embed/LRORznnSGSNYqjUxUf" width="500" height="500" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>
