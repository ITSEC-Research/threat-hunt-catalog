#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Ripoff from https://github.com/magicsword-io/sigconverter.io/blob/main/backend/backend.py
ssshhh, don't tell anyone. P.S. you should probably ditch or reword this comment if you're
actually using it in production.
"""

import html
import yaml
import base64
import requests
import importlib.metadata as metadata
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

from sigma.conversion.base import Backend
from sigma.plugins import InstalledSigmaPlugins
from sigma.collection import SigmaCollection
from sigma.exceptions import SigmaError
from sigma.processing import pipeline
from sigma.processing.pipeline import ProcessingPipeline

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
plugins = InstalledSigmaPlugins.autodiscover()
pipeline_generic = pipeline.ProcessingPipeline()
backends = plugins.backends
pipeline_resolver = plugins.get_pipeline_resolver()
pipelines = list(pipeline_resolver.list_pipelines())


def convert_sigma_rule(sigma_rule, target="opensearch_lucene", format="dsl_lucene", 
                      builtin_pipeline=None, custom_pipeline_yml=None):
    """
    Convert a Sigma rule to target platform format
    
    Parameters:
        - sigma_rule (string): Sigma rule in YAML format
        - target (string): Target backend name (default: "opensearch_lucene")
        - format (string): Output format name (default: "dsl_lucene")
        - builtin_pipeline (list): List of built-in pipeline names to apply (optional)
        - custom_pipeline_yml (string): Custom pipeline YAML content (optional)
    
    Returns:
        - Success: Converted rule as string
        - Raises: Various exceptions for different error conditions
    """
    # Validate YAML input
    try:
        yaml.safe_load_all(sigma_rule)
    except Exception as e:
        raise yaml.YAMLError(f"Malformed yaml file: {str(e)}")

    # Process builtin pipelines
    pipeline_list = []
    if builtin_pipeline:
        for p in builtin_pipeline:
            pipeline_list.append(p)

    # Process custom pipelines
    custom_pipelines_list = []
    if custom_pipeline_yml:
        pipeline_yml_list = custom_pipeline_yml.split("\n---")
        for pipeline_ in pipeline_yml_list:
            try:
                custom_pipelines_list.append(pipeline_generic.from_yaml(pipeline_))
            except Exception as e:
                raise yaml.YAMLError(f"Malformed Pipeline Yaml: {str(e)}")

    # Get backend
    try:
        backend_class = backends[target]
    except KeyError:
        raise KeyError(f"Unknown Target: {target}")
    
    # Resolve processing pipeline
    try:
        processing_pipeline = pipeline_resolver.resolve(pipeline_list)
    except Exception:
        raise Exception(f"Unknown Builtin Pipeline")

    # Add custom pipelines
    for pipeline_ in custom_pipelines_list:
        if isinstance(pipeline_, ProcessingPipeline):
            processing_pipeline += pipeline_

    # Create backend instance
    backend: Backend = backend_class(processing_pipeline=processing_pipeline)

    # Convert the rule
    try:
        sigma_collection = SigmaCollection.from_yaml(sigma_rule)
        result = backend.convert(sigma_collection, format)
        if isinstance(result, list):
            result = result[0]
        return result
    except SigmaError as e:
        raise SigmaError(f"SigmaError: {str(e)}")
    except Exception as e:
        raise Exception(f"UnknownError: {str(e)}")


@app.route("/api/v1/targets", methods=["GET"])
def get_targets():
    """
    Get all available target platforms (backends)
    
    Parameters: None
    
    Returns:
        JSON array of objects with:
        - name: Backend identifier (string)
        - description: Human-readable backend name (string)
    
    Example: GET /api/v1/targets
    """
    response = []
    for name, backend in backends.items():
            response.append(
            {"name": name, "description": backend.name}
            )
    return jsonify(response)

@app.route("/api/v1/formats", methods=["GET"])
def get_formats():
    """
    Get available output formats
    
    Query Parameters:
        - target (optional): Filter formats by specific target backend
    
    Returns:
        JSON array of objects with:
        - name: Format identifier (string)
        - description: Format description (string)
        - target: Backend name (string) - only if no target filter applied
    
    Examples:
        GET /api/v1/formats                    # All formats for all targets
        GET /api/v1/formats?target=splunk      # Only Splunk formats
    """
    args = request.args
    response = []
    if len(args) == 0:
        for backend in backends.keys():
            for name, description in plugins.backends[backend].formats.items():
                response.append(
                    {"name": name, "description": description, "target": backend}
                )
    elif "target" in args:
        target = args.get("target")
        for backend in backends.keys():
            if backend == target:
                for name, description in plugins.backends[backend].formats.items():
                    response.append(
                        {"name": name, "description": description}
                    )

    return jsonify(response)

@app.route("/api/v1/pipelines", methods=["GET"])
def get_pipelines():
    """
    Get available processing pipelines
    
    Query Parameters:
        - target (optional): Filter pipelines by target backend compatibility
    
    Returns:
        JSON array of objects with:
        - name: Pipeline identifier (string)
        - targets: Array of compatible backend names (array of strings)
    
    Examples:
        GET /api/v1/pipelines                    # All pipelines
        GET /api/v1/pipelines?target=splunk      # Pipelines compatible with Splunk
    """
    args = request.args
    response = []
    if len(args) == 0:
        for name, pipeline in pipelines:
            response.append({"name": name, "targets": list(pipeline.allowed_backends)})
    elif "target" in args:
        target = args.get("target")
        for name, pipeline in pipelines:
            if (len(pipeline.allowed_backends) == 0) or (target in pipeline.allowed_backends):
                response.append({"name": name, "targets": list(pipeline.allowed_backends)})
    return jsonify(response)


@app.route("/api/v1/convert", methods=["POST"])
def convert():
    """
    Convert Sigma rules to target platform format
    
    Required JSON Body Parameters:
        - rule (string): Base64-encoded Sigma rule in YAML format
        - target (string): Target backend name (get from /api/v1/targets)
        - format (string): Output format name (get from /api/v1/formats)
    
    Optional JSON Body Parameters:
        - pipeline (array): Array of built-in pipeline names to apply (default: [])
        - pipelineYml (string): Base64-encoded custom pipeline YAML (default: "")
        - html (string): "true" to HTML-escape output, "false" otherwise (default: "false")
    
    Returns:
        - Success: Converted rule as plain text
        - Error: HTTP error with message
    
    Example Request Body:
    {
        "rule": "dGl0bGU6IFN1c3BpY2lvdXMgUG93ZXJTaGVsbA==",  # Base64 encoded YAML
        "target": "splunk",
        "format": "default",
        "pipeline": ["sysmon"],
        "pipelineYml": "",
        "html": "false"
    }
    
    Possible Errors:
        - 400: YamlError (malformed YAML)
        - 400: Unknown Target
        - 400: Unknown Builtin Pipeline
        - 400: SigmaError (rule conversion error)
        - 400: UnknownError (other errors)
    """
    # Decode base64 rule
    rule = str(base64.b64decode(request.json["rule"]), "utf-8")
    
    # Get parameters
    target = request.json["target"]
    format = request.json["format"]
    pipeline_list = request.json.get("pipeline", [])
    html_escape = request.json.get("html") == "true"
    
    # Decode custom pipeline if provided
    custom_pipeline_yml = None
    if request.json.get("pipelineYml"):
        custom_pipeline_yml = str(base64.b64decode(request.json["pipelineYml"]), "utf-8")

    try:
        # Use the extracted function
        result = convert_sigma_rule(
            sigma_rule=rule,
            target=target,
            format=format,
            builtin_pipeline=pipeline_list,
            custom_pipeline_yml=custom_pipeline_yml
        )
        
        # Apply HTML escaping if requested
        if html_escape:
            result = html.escape(result)
            
        return result
        
    except yaml.YAMLError:
        return Response("YamlError: Malformed yaml file", status=400, mimetype="text/html")
    except KeyError:
        return Response("Unknown Target", status=400, mimetype="text/html")
    except SigmaError as e:
        return Response(str(e), status=400, mimetype="text/html")
    except Exception as e:
        error_msg = str(e)
        if "Unknown Builtin Pipeline" in error_msg:
            return Response("Unknown Builtin Pipeline", status=400, mimetype="text/html")
        else:
            return Response(f"UnknownError: {error_msg}", status=400, mimetype="text/html")


@app.route("/api/opensearch-proxy", methods=["POST", "GET", "PUT", "DELETE"])
def opensearch_proxy():
    """
    Dynamic OpenSearch proxy endpoint

    This endpoint forwards requests to any OpenSearch server dynamically.
    It handles CORS issues and allows the frontend to connect to any OpenSearch instance.

    Required Headers:
        - X-OpenSearch-URL: Target OpenSearch URL (e.g., "http://10.110.20.10:9200")
        - X-OpenSearch-Path: Path to query (e.g., "/_cluster/health", "/_search")

    Optional Headers:
        - Authorization: Basic auth header for OpenSearch

    Request Body:
        - Forwards the body as-is to OpenSearch

    Returns:
        - Proxied response from OpenSearch with appropriate status code

    Example:
        POST /api/opensearch-proxy
        Headers:
            X-OpenSearch-URL: http://10.110.20.10:9200
            X-OpenSearch-Path: /_cluster/health
            Authorization: Basic dXNlcjpwYXNz
    """
    try:
        # Get target URL and path from headers
        opensearch_url = request.headers.get('X-OpenSearch-URL')
        opensearch_path = request.headers.get('X-OpenSearch-Path', '/')

        if not opensearch_url:
            return jsonify({"error": "X-OpenSearch-URL header is required"}), 400

        # Build target URL
        target_url = f"{opensearch_url.rstrip('/')}{opensearch_path}"

        print(f"[Proxy] Forwarding {request.method} request to: {target_url}")

        # Build headers for OpenSearch request
        forward_headers = {
            'Content-Type': 'application/json'
        }

        # Forward Authorization header if present
        if 'Authorization' in request.headers:
            forward_headers['Authorization'] = request.headers['Authorization']

        # Get request body if present
        body = request.get_json(silent=True) if request.method in ['POST', 'PUT'] else None

        # Make request to OpenSearch - only pass json parameter if body exists
        request_params = {
            'method': request.method,
            'url': target_url,
            'headers': forward_headers,
            'timeout': 30,
            'verify': False  # Disable SSL verification for development
        }

        if body is not None:
            request_params['json'] = body

        response = requests.request(**request_params)

        print(f"[Proxy] OpenSearch responded with status: {response.status_code}")

        # Return the response from OpenSearch
        return Response(
            response.content,
            status=response.status_code,
            headers={'Content-Type': 'application/json'}
        )

    except requests.exceptions.RequestException as e:
        print(f"[Proxy Error] RequestException: {str(e)}")
        return jsonify({
            "error": "Failed to connect to OpenSearch",
            "details": str(e)
        }), 500
    except Exception as e:
        print(f"[Proxy Error] Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Proxy error",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    #current_version = metadata.version("sigma-cli")
    #port = int(f'8{current_version.replace(".","")}')
    PORT = 8080
    HOST = "0.0.0.0"
    app.run(host=HOST, port=PORT)