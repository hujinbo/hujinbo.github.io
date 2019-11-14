---
title: Kubernetes环境搭建
tags: Kubernetes
categories: Kubernetes
comments: true
mathjax: false
abbrlink: 60546
date: 2019-11-14 22:11:16
updated: 2019-11-14 22:11:16
description:
---
## Linux Kubernetes 安装

### 基础环境准备

1. 关闭防火墙

   ```bash
   systemctl stop firewalld
   systemctl disable firewalld
   ```

2. 禁用SELinux

   ```bash
   sudo setenforce 0
   sudo sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config
   ```

3. 禁用交换分区

   ```bash
   swapoff -a
   sed -ri 's/.*swap.*/#&/' /etc/fstab
   ```

<!-- more -->
4. 网络配置

   ```bash
   # 确保br_netfilter模块被加载
   sudo modprobe br_netfilter
   cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
   br_netfilter
   EOF
   
   # 将桥接的IPv4流量传递到iptables
   cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
   net.bridge.bridge-nf-call-ip6tables = 1
   net.bridge.bridge-nf-call-iptables = 1
   EOF
   sudo sysctl --system
   ```

5. 配置阿里云yum源

   ```bash
   cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
   [kubernetes]
   name=Kubernetes
   baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
   enabled=1
   gpgcheck=1
   repo_gpgcheck=0
   gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
   exclude=kubelet kubeadm kubectl
   EOF
   ```

6. 安装kubeadm、kubelet和kubectl

   ```bash
   sudo yum install -y kubelet-1.23.15 kubeadm-1.23.15 kubectl-1.23.15 --disableexcludes=kubernetes

   # 重启Docker以便将ip_forward设置为1（上面执行sysctl --system时值被恢复为0）
   sudo systemctl restart docker
   
   sudo systemctl enable kubelet
   sudo systemctl start kubelet
   ```

7. 配置cgroup驱动程序  
   确保容器运行时和kubelet所使用的是相同的cgroup驱动，建议使用systemd。驱动不一致会导致kubelet启动失败

### 使用kubeadm创建集群

#### Master节点

1. 使用kubeadm创建集群

   把`apiserver-advertise-address`改成主节点的内网ip地址，执行命令后等待2分钟拉取镜像

   ```bash
   kubeadm init --kubernetes-version=1.23.15 \
   --apiserver-advertise-address=10.0.20.9 \
   --pod-network-cidr=10.244.0.0/16 \
   --image-repository registry.aliyuncs.com/google_containers
   ```
   
   安装成功后，执行以下命令
   ```bash
   mkdir -p $HOME/.kube
   sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
   sudo chown $(id -u):$(id -g) $HOME/.kube/config
   ```

2. 安装Flannel网络插件

    ```bash
    kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
   
    # 等插件安装完成后，查看是否成功创建flannel网络
    ifconfig | grep flannel
    ```

3. 检查节点状态

   ```bash
   # 检查master运行情况
   kubectl get node
   
   # 查看所有节点状态，都应处于Running
   kubectl get pods --all-namespaces
   ```

4. 配置Master节点参与调度，适用于单机Kubernetes集群（可选）

   ```bash
   kubectl taint nodes --all node-role.kubernetes.io/master-
   ```

#### Worker节点

1. 在master节点执行以下命令，生成join命令

   ```bash
   kubeadm token create --print-join-command
   ```

2. 在worker节点执行上面生成的join命令

   ```bash
   kubeadm join 172.16.16.130:6443 --token 2dsf3t.4edwjvqpaais8i15     --discovery-token-ca-cert-hash sha256:c86954eb1d30617305472d42c091be73f22b9cf9b68764e84f4c95129053322c
   ```

3. 检查节点状态

   ```bash
   # 检查master、worker运行情况
   kubectl get node
      
   # 查看所有节点状态，都应处于Running
   kubectl get pods --all-namespaces
   ```
   
4. 拷贝admin.conf，在worker节点执行kubectl命令（可选）

   当我们worker节点成功加入集群后，我们执行`kubectl get nodes`之类的命令会报如下错误：

   ```
   The connection to the server localhost:8080 was refused - did you specify the right host or port?
   ```

   解决方式如下：

   ```bash
   # 将master节点的admin.conf拷贝到worker节点
   scp /etc/kubernetes/admin.conf root@172.16.16.139:/etc/kubernetes/
   
   # 在worker节点将admin.conf拷贝到.kube/config目录下
   mkdir -p $HOME/.kube
   sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
   sudo chown $(id -u):$(id -g) $HOME/.kube/config
   ```


## 安装 Dashboard

1. 部署Dashboard

   下载dashboard.yaml文件
   
   ```bash
   curl -fsSL https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml -o dashboard.yaml
   ```
   
   将Service类型改为`NodePort`，设置`nodePort: 31707`暴露端口
   
   ```yaml
   kind: Service
   ...
   spec:
     type: NodePort
     ports:
       - port: 443
         targetPort: 8443
         nodePort: 31707
     selector:
       k8s-app: kubernetes-dashboard
   ```
   
   部署dashboard
   
   ```bash
   kubectl apply -f dashboard.yaml
   ```

2. 非安全的浏览器访问

   通过chrome访问`https://81.71.87.234:31707`, 出现"您的连接不是私密连接"，无法访问Dashboard。  
   解决办法：鼠标点击当前页面，键盘直接输入`thisisunsafe`，然后回车即可  

3. 获取登录Token

   ```bash
   kubectl -n kube-system describe $(kubectl -n kube-system get secret -n kube-system -o name | grep namespace) | grep token
   ```

4. 登录Dashboard


{% note warning %}
注：更多详细内容，请阅读**[K8s官方文档](https://kubernetes.io/zh/docs/setup/production-environment/tools/kubeadm/install-kubeadm/) 、 [Dashboard官方文档](https://github.com/kubernetes/dashboard)**
{% endnote %}