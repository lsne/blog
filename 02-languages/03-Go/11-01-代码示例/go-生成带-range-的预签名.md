
### 生成带 range 的预签名url

```go
// 生成预签名 GET URL
func (c *S3Ceph) GenerateGetPresign(bucketName string, objectName string, resConTentType string, expireTime time.Duration) (string, error) {

	// 创建一个 S3 客户端对象
	svc := s3.New(c.Session)

	// 设置预签名URL的参数
	req, _ := svc.GetObjectRequest(&s3.GetObjectInput{
		Bucket:              aws.String(bucketName),
		Key:                 aws.String(objectName),
		ResponseContentType: aws.String(resConTentType),
		Range:               aws.String("bytes=0-499"),
	})

	// 生成预签名URL, 必须传入一个过期时间
	return req.Presign(expireTime)
}
```

### 使用带 range 的预签名url

```sh
curl -H "range: bytes=0-499" 'http://10.57.144.235:7480/mybucket/tmpdir/aaa.log?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=2QBGE1G3MNJZCO33S0QF%2F20240402%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240402T022648Z&X-Amz-Expires=1800&X-Amz-SignedHeaders=host%3Brange&response-content-type=application%2Foctet-stream&X-Amz-Signature=5726f814b1e1e50fb6cb99d0cfe3ec07951a1ea8903c0c131985f1a5d90a31e4'
```