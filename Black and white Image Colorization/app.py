import numpy as np 
import cv2
import gradio as gr

print("loading models.....")
net = cv2.dnn.readNetFromCaffe('colorization_deploy_v2.prototxt','colorization_release_v2.caffemodel')
pts = np.load('pts_in_hull.npy')

class8 = net.getLayerId("class8_ab")
conv8 = net.getLayerId("conv8_313_rh")
pts = pts.transpose().reshape(2,313,1,1)

net.getLayer(class8).blobs = [pts.astype("float32")]
net.getLayer(conv8).blobs = [np.full([1,313],2.606,dtype='float32')]


def colorize_image(image):
    # Convert the PIL image to OpenCV format
    image = np.array(image)
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    
    scaled = image.astype("float32")/255.0
    lab = cv2.cvtColor(scaled, cv2.COLOR_BGR2LAB)

    resized = cv2.resize(lab, (224, 224))
    L = cv2.split(resized)[0]
    L -= 50

    net.setInput(cv2.dnn.blobFromImage(L))
    ab = net.forward()[0, :, :, :].transpose((1, 2, 0))
    ab = cv2.resize(ab, (image.shape[1], image.shape[0]))

    L = cv2.split(lab)[0]
    colorized = np.concatenate((L[:, :, np.newaxis], ab), axis=2)
    colorized = cv2.cvtColor(colorized, cv2.COLOR_LAB2RGB)
    colorized = np.clip(colorized, 0, 1)
    colorized = (255 * colorized).astype("uint8")

    return colorized


demo = gr.Interface(
    colorize_image,
    gr.Image(type="pil",label='Upload a black and white image'),
    "image",
    title="Image Colorization",
    examples = ["Landscape.jpg","nnl.jpg","bw.jpg","qqqq.jpg","rrr.jpg","zzz.jpg"]
)

if __name__ == "__main__":
    demo.launch()
