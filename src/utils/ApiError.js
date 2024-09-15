class ApiError extends Error{
    constructor(
        statusCode,
        message
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
    }
}

export {ApiError}