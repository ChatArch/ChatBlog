# 用 CRS Key 生成图片

先在 ChatEnv 的 OpenAI 类型中准备一个 `crs` profile，填写 `OPENAI_API_BASE`、`OPENAI_API_KEY` 和 `OPENAI_API_MODEL`。

## Python + ChatEnv

```bash
pip install chatimg
chatenv new -t oai crs
# 用编辑器填写 ~/.chatarch/envs/OpenAI/crs.env 中的 CRS 地址、Key 和承载模型。
# 已有配置则跳过 new；CHATARCH_HOME 自定义时使用其 envs/OpenAI/crs.env。
curl --version
python generate_image.py --profile crs --host-model gpt-5.5 --prompt-file prompt.txt --output quicksort.png
```

`generate_image.py` 是配套示例，不是 ChatImg 的内置子命令。它只读取 CRS 调用 Key，网络请求使用 curl。默认图片模型 gpt-image-2、中等质量、1536x1024。

从已保存的真实响应重新解码，不会再次请求服务：

```bash
python generate_image.py --decode response.sse --output quicksort-copy.png
```

## 纯 curl

Bash 环境，准备 curl、jq、base64：

```bash
export CRS_API_BASE='https://crs.example.com/openai/v1'
read -r -s -p 'CRS API Key: ' CRS_API_KEY
printf '\n'
export CRS_API_KEY
bash curl_image_tool.sh request.json quicksort.png
```

替换示例域名和自己的 Key，按服务支持情况选择承载模型。修改 `request.json` 内的提示词可以生成其他主题。Key 不进入请求 JSON 或 curl 命令行参数；脚本会保留 SSE 便于复用。请使用新输出文件名保存每次结果。
