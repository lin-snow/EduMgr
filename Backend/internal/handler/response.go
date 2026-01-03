package handler

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func OK(data any) Response {
	return Response{Code: 0, Message: "ok", Data: data}
}

func Err(code int, message string) Response {
	return Response{Code: code, Message: message}
}

