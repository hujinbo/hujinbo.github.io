---
title: Spark在Docker环境下中文乱码问题
tags: Spark
categories: Spark
comments: true
mathjax: false
abbrlink: 56475
date: 2020-09-15 23:00:12
updated: 2020-09-15 23:00:12
description:
---

> 具体表现为：日志的中文字符变为`???`符号，启动Spark History Server时报错：java.nio.charset.MalformedInputException: Input length = 1

## 解决方式

添加环境变量`LC_ALL=en_US.UTF-8`，如下示例为k8s的yaml配置方式：
```yaml
  containers:
    - name: spark
      image: "swr.cn-north-1.myhuaweicloud.com/nascent/spark-quantbi:spark_3.0_0914_3"
      imagePullPolicy: IfNotPresent
      env:
        - name: TZ
          value: Asia/Shanghai
        - name: LC_ALL
          value: en_US.UTF-8
```

## 问题描述

公司有两套Spark环境，一套使用本地部署，一套使用Docker部署，在日常使用中，通常包含很多中文字段的日志打印。  
在本地部署的环境中文日志显示正常，而一但通过Docker打包发布后，就出现中文乱码了。  
在开启Spark History Server后，包含中文的Application更是直接报错，影响正常使用。
<!-- more -->
1. 使用Spark UI查看日志，发现中文全部乱码，变为`?`符号：
```
20/09/15 09:14:35.849 CST main WARN org.apache.spark.sql.execution.datasources.jdbc.JdbcUtils: Create Table Sql: [CREATE TABLE snappy_2fb345e26060499e8ec47b4f9d96d1fe (`??` bigint , `??` integer , `????` datetime , `????` datetime )]
```

2. 开启Spark History Server后，只要ETL包含中文，解析就会报错：
```
20/09/15 09:57:19.450 CST worker-cleanup-thread INFO org.apache.spark.deploy.worker.Worker: Cleaning up local directories for application app-20200915095627-0016
20/09/15 09:57:21.388 CST log-replay-executor-3 INFO org.apache.spark.deploy.history.FsHistoryProvider: Parsing file:/opt/tmp/spark-events/eventlog_v2_app-20200915095627-0016 for listing data...
20/09/15 09:57:21.392 CST log-replay-executor-3 ERROR org.apache.spark.deploy.history.FsHistoryProvider: Exception while merging application listings
java.nio.charset.MalformedInputException: Input length = 1
	at java.nio.charset.CoderResult.throwException(CoderResult.java:281)
	at sun.nio.cs.StreamDecoder.implRead(StreamDecoder.java:339)
	at sun.nio.cs.StreamDecoder.read(StreamDecoder.java:178)
	at java.io.InputStreamReader.read(InputStreamReader.java:184)
	at java.io.BufferedReader.fill(BufferedReader.java:161)
	at java.io.BufferedReader.readLine(BufferedReader.java:324)
	at java.io.BufferedReader.readLine(BufferedReader.java:389)
	at scala.io.BufferedSource$BufferedLineIterator.hasNext(BufferedSource.scala:74)
	at scala.collection.Iterator$$anon$20.hasNext(Iterator.scala:884)
	at scala.collection.Iterator$$anon$12.hasNext(Iterator.scala:511)
	at org.apache.spark.scheduler.ReplayListenerBus.replay(ReplayListenerBus.scala:82)
	at org.apache.spark.deploy.history.FsHistoryProvider.$anonfun$doMergeApplicationListing$4(FsHistoryProvider.scala:777)
	at org.apache.spark.deploy.history.FsHistoryProvider.$anonfun$doMergeApplicationListing$4$adapted(FsHistoryProvider.scala:759)
	at org.apache.spark.util.Utils$.tryWithResource(Utils.scala:2539)
	at org.apache.spark.deploy.history.FsHistoryProvider.doMergeApplicationListing(FsHistoryProvider.scala:759)
	at org.apache.spark.deploy.history.FsHistoryProvider.mergeApplicationListing(FsHistoryProvider.scala:675)
	at org.apache.spark.deploy.history.FsHistoryProvider.$anonfun$checkForLogs$13(FsHistoryProvider.scala:545)
	at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:511)
	at java.util.concurrent.FutureTask.run(FutureTask.java:266)
	at java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)
	at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)
	at java.lang.Thread.run(Thread.java:748)
```
不包含中文则可以正常解析：
```
20/09/15 09:58:33.352 CST worker-cleanup-thread INFO org.apache.spark.deploy.worker.Worker: Cleaning up local directories for application app-20200915095822-0017
20/09/15 09:58:41.403 CST log-replay-executor-0 INFO org.apache.spark.deploy.history.FsHistoryProvider: Parsing file:/opt/tmp/spark-events/eventlog_v2_app-20200915095822-0017 for listing data...
20/09/15 09:58:41.407 CST log-replay-executor-0 INFO org.apache.spark.deploy.history.FsHistoryProvider: Finished parsing file:/opt/tmp/spark-events/eventlog_v2_app-20200915095822-0017
```

## 排查过程

1. 根据错误堆栈，找到读取日志文件的代码：
![](https://img.hujinbo.me/blog/sCC78J.png)

2. 查看`Source.fromInputStream`源码，可以看到默认使用`Codec.default`的编码：
![](https://img.hujinbo.me/blog/JATmVQ.png)

3. 查看`Codec.default`源码，可以看到默认使用的是`Charset.defaultCharset`的编码：
![](https://img.hujinbo.me/blog/zL1c8w.png)

4. 而`Charset.defaultCharset`读取的是`file.encoding`的值：
![](https://img.hujinbo.me/blog/oXiqJh.png)

5. 关闭Spark History Server日志压缩，下载日志文件，发现文件编码为`UTF-8`且中文写入正常，故日志写入方面没有问题：
![](https://img.hujinbo.me/blog/rZjyfq.png)

6. 通过Spark UI查看Spark系统环境变量，发现编码为`ANSI_X3.4-1968`，可能是使用该编码读取文件时引发报错:
![](https://img.hujinbo.me/blog/344l9I.png)

7. 为验证上述猜想，编写测试用例，使用`Source`读取日志文件，并指定编码为`ANSI_X3.4-1968`，可以复现Spark History Server的报错：
![](https://img.hujinbo.me/blog/H4PEMv.png)

8. 而指定编码为`UTF-8`时，文件读取正常。所以，只需让读取到的`file.encoding`为`UTF-8`即可解决乱码和报错的问题。
![](https://img.hujinbo.me/blog/Al1A1v.png)

9. 而日志打印中文乱码问题，是因为磁盘只能存储二进制文件，故Java程序在写文件时会调用`String.getByte`方法将对象转为byte，然后再写入磁盘。
查看相关源码，发现它使用的编码也是上面提到的`Charset.defaultCharset`系统默认编码。
![](https://img.hujinbo.me/blog/xmTpZV.png)

10. 所以上述2个问题，都是由于Docker环境下未指定系统默认字符集为`UTF-8`，导致读取`file.encoding`为`ANSI_X3.4-1968`所引发的。

## 注意事项

在排查过程中，进入容器后，使用`locale`命令或启动`spark-shell`执行`println(Charset.defaultCharset)`检查编码均正常，故不能使用这2种方法判断。  
除了上述Spark UI查看`file.encoding`的方式，也可以使用Arthas诊断工具的`sysprop`命令进行查看当前JVM的`file.encoding`属性。
![](https://img.hujinbo.me/blog/IHFjQC.png)
