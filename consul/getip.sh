PUBLIC_IP=$(ifconfig en0 | awk -F ' *|:' '/inet /{print $2}')
echo $PUBLIC_IP
